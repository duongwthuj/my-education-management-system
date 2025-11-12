// ========== CONFIG ==========
const API_KEY = "AIzaSyAB6EYIc9FZFGeWJTo73yI700UPIDYojws";
const MODEL = "gemini-2.5-flash";
const LABEL_NAME = "Offset_process";
const SHEET_NAME = "OffsetAI";

/**
 * HƯỚNG DẪN SỬ DỤNG:
 * 
 * 1. runAll() - Function tổng hợp chạy TẤT CẢ (đặt trigger cho function này)
 *    - Xử lý mail offset mới
 *    - Reply xác nhận/từ chối
 *    - Kiểm tra và reply thông tin giáo viên khi đủ điều kiện
 * 
 * 2. main() - Chạy script chính để xử lý TẤT CẢ mail offset
 *    - Tìm TẤT CẢ mail offset trong 7 ngày (có label hay không)
 *    - Tự động bỏ qua mail đã xử lý và đã có trong sheet
 *    - Tự động gán label cho mọi mail
 *    - Parse và ghi data vào sheet cho mail mới
 * 
 * 3. replyWithTeacherAssignment() - Reply thông tin giáo viên khi đủ điều kiện
 * 
 * 4. viewProcessedIds() - Xem danh sách mail đã xử lý
 * 
 * 5. resetProcessedIds() - Reset bộ nhớ để xử lý lại từ đầu
 *    CẢNH BÁO: Sẽ xử lý lại TẤT CẢ mail!
 * 
 * 6. removeLabelFromAllOffsetMails() - Xóa label để test
 * 
 * 7. syncAllDataToSheet() - Đồng bộ data từ mail có label (dự phòng)
 */

// ========== MAIN ORCHESTRATOR ==========
/**
 * Function tổng hợp - Chạy TẤT CẢ các bước xử lý offset
 * Đặt trigger 5 phút cho function này là đủ!
 */
function runAll() {
  Logger.log("🚀 BẮT ĐẦU CHẠY TỰ ĐỘNG - runAll()");
  
  try {
    // Bước 1: Xử lý mail offset mới
    Logger.log("📧 Bước 1: Xử lý mail offset mới...");
    main();
    
    // Delay 2 giây để đảm bảo main() hoàn thành
    Utilities.sleep(2000);
    
    // Bước 2: Kiểm tra và reply thông tin giáo viên (nếu đủ điều kiện)
    Logger.log("👨‍🏫 Bước 2: Kiểm tra và reply thông tin giáo viên...");
    replyWithTeacherAssignment();
    
    Logger.log("✅ HOÀN THÀNH - runAll()");
    SpreadsheetApp.getActiveSpreadsheet().toast("✅ Đã xử lý xong mail và reply giáo viên!");
    
  } catch (error) {
    Logger.log(`❌ LỖI trong runAll(): ${error.message}`);
    Logger.log(error.stack);
    SpreadsheetApp.getActiveSpreadsheet().toast(`❌ Lỗi: ${error.message}`);
  }
}


// ========== MAIN FUNCTION ==========
function main() {
  const label = GmailApp.getUserLabelByName(LABEL_NAME) || GmailApp.createLabel(LABEL_NAME);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Người gửi", "Thời gian gửi", "JSON dữ liệu", "Kết quả phản hồi"]);
  }

  const scriptProps = PropertiesService.getScriptProperties();
  const processedIds = JSON.parse(scriptProps.getProperty("processedIds") || "[]");
  Logger.log(`📊 Có ${processedIds.length} mail đã xử lý trong bộ nhớ`);

  // � TÌM TẤT CẢ MAIL OFFSET (bỏ filter -label:Offset_process)
  const threads = GmailApp.search('subject:(offset) newer_than:7d');
  Logger.log(`📬 Tìm thấy ${threads.length} mail offset trong 7 ngày`);

  if (!threads.length) {
    Logger.log("Không có mail offset.");
    return;
  }

  let newMailCount = 0;
  let skippedCount = 0;

  for (const thread of threads) {
    const msg = thread.getMessages()[0];
    const msgId = msg.getId();
    const sender = msg.getFrom();
    const sentTime = msg.getDate();

    // 🔒 Kiểm tra thread đã có label chưa
    const hasLabel = thread.getLabels().some(l => l.getName() === LABEL_NAME);
    
    // 🔒 Kiểm tra đã có trong sheet chưa
    const isInSheet = checkMailInSheet(sheet, msgId, sender, sentTime);
    
    if (isInSheet && processedIds.includes(msgId)) {
      // Đã xử lý VÀ đã có trong sheet → skip
      Logger.log(`⏩ Bỏ qua mail đã xử lý: ${msg.getSubject()}`);
      thread.addLabel(label); // Đảm bảo có label
      skippedCount++;
      continue;
    }

    // Mail chưa xử lý HOẶC chưa có trong sheet → xử lý
    Logger.log(`🆕 Xử lý mail: ${msg.getSubject()}`);
    
    const body = msg.getPlainBody();

    const data = extractOffsetData(body);
    if (!data || !data.cac_buoi?.length || !data.subjectCode) {
      sheet.appendRow([sender, sentTime, "❌ Không trích xuất được dữ liệu", "Không phản hồi"]);
      if (!processedIds.includes(msgId)) {
        processedIds.push(msgId);
      }
      scriptProps.setProperty("processedIds", JSON.stringify(processedIds));
      Logger.log(`⚠️ Mail không parse được, đã đánh dấu: ${msgId}`);
      continue;
    }

    // Ghi JSON ra sheet
    sheet.appendRow([sender, sentTime, JSON.stringify(data, null, 2), "⏳ Đang xử lý"]);
    newMailCount++;

    const buoiDau = data.cac_buoi[0];
    const ngayHoc = buoiDau.ngay;
    const gioHoc = buoiDau.gio_bat_dau;
    const dateTimeHoc = parseVietnamDateTime(`${ngayHoc} ${gioHoc}`);

    if (!dateTimeHoc || isNaN(dateTimeHoc.getTime())) {
      Logger.log("⚠️ Không tính được thời gian học");
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 4).setValue("⚠️ Lỗi thời gian");
      if (!processedIds.includes(msgId)) {
        processedIds.push(msgId);
      }
      scriptProps.setProperty("processedIds", JSON.stringify(processedIds));
      Logger.log(`⚠️ Lỗi thời gian, đã đánh dấu: ${msgId}`);
      continue;
    }

    const diffHours = (dateTimeHoc.getTime() - sentTime.getTime()) / (1000 * 60 * 60);
    Logger.log(`📅 Mail: ${msg.getSubject()} | Gửi: ${Utilities.formatDate(sentTime, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm")} → Học: ${ngayHoc} ${gioHoc} (${diffHours.toFixed(2)}h)`);

    let result = "✅ Đã xử lý";
    
    // 📧 CHỈ REPLY NẾU THREAD CHƯA CÓ LABEL (mail lần đầu)
    if (!hasLabel) {
      if (diffHours < 24) {
        replyRejectMail(msg, sentTime, ngayHoc, gioHoc);
        result = "❌ Reject (<24h)";
      } else {
        replyConfirmMail(msg);
        result = "✅ Đã xác nhận";
      }
      Logger.log(`📨 Đã reply mail lần đầu: ${msg.getSubject()}`);
    } else {
      Logger.log(`⏭️ Thread đã có label, bỏ qua reply: ${msg.getSubject()}`);
      result = "✅ Đã xử lý (không reply - đã có label)";
    }
    
    // 🏷️ Gán label SAU KHI reply (đảm bảo chỉ reply 1 lần)
    thread.addLabel(label);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setValue(result);

    // 🔒 Đánh dấu đã xử lý và lưu ngay (tránh trùng lặp)
    if (!processedIds.includes(msgId)) {
      processedIds.push(msgId);
    }
    scriptProps.setProperty("processedIds", JSON.stringify(processedIds));
    Logger.log(`✅ Đã xử lý và lưu mail ID: ${msgId}`);
  }

  // Lưu lại lần cuối (đề phòng)
  scriptProps.setProperty("processedIds", JSON.stringify(processedIds));
  
  Logger.log(`💾 Tổng kết: ${newMailCount} mail mới xử lý | ${skippedCount} mail đã có | Tổng: ${processedIds.length} mail trong bộ nhớ`);
  SpreadsheetApp.getActiveSpreadsheet().toast(`✅ Xử lý xong! ${newMailCount} mail mới | ${skippedCount} mail bỏ qua`);
}

// ========== PHẢN HỒI ==========
function replyRejectMail(msg, sentTime, ngay, gio) {
  const body = `
Dear all,

Bộ phận chuyên môn phản hồi:

Theo quy định, yêu cầu sắp xếp lớp offset cần được gửi trước ít nhất 24 giờ so với thời gian buổi học.
Các yêu cầu gửi sau 21h sẽ được tính là gửi vào lúc 8h sáng ngày hôm sau.

Mail được gửi lúc ${Utilities.formatDate(sentTime, "Asia/Ho_Chi_Minh", "HH'h'mm dd/MM/yyyy")} cho buổi học ${gio} ngày ${ngay}, nên không đáp ứng thời hạn quy định.
Bộ phận chuyên môn xin phép từ chối yêu cầu này và đề nghị gửi lại lịch học mới theo đúng quy định.

Trân trọng,
Dương Thụ - [ST - Edtech]
`;
  msg.replyAll(body);
  Logger.log(`📩 Đã replyAll từ chối: ${msg.getSubject()}`);
}

function replyConfirmMail(msg) {
  const body = `
Dear all,

Bộ phận chuyên môn đã nhận được thông tin offset. BPCM sẽ sắp xếp giáo viên và phản hồi lại luồng mail sớm nhất để buổi học diễn ra thuận lợi.

Trân trọng,
Dương Thụ - [ST - Edtech]
`;
  msg.replyAll(body);
  Logger.log(`📩 Đã replyAll xác nhận: ${msg.getSubject()}`);
}

// ========== PHÂN TÍCH EMAIL ==========
function extractOffsetData(emailText) {
  const prompt = `
Bạn là trợ lý phân tích email offset của trung tâm Teky. Hãy trích xuất CHÍNH XÁC thông tin từ email và trả về ĐÚNG format JSON dưới đây.
Tôi sẽ có các môn học: Bé làm game, Siêu nhân lập trình web, siêu nhân làm game, DigiStyle Multimedi, Multimedia, siêu nhân lập trình

nó sẽ có các mã lớp BLG, SNLTW, SNLG, DSMM, SNLT

QUAN TRỌNG: 
- CHỈ trả về JSON thuần túy, KHÔNG thêm markdown, code block hay text giải thích
- Nếu không tìm thấy thông tin, để chuỗi rỗng ""
- Giữ nguyên format của số và text từ email gốc
- subjectCode phải theo format: VIẾT_TẮT_TÊN_MÔN_HPX (vd: "BLG_HP5" cho Blockly Game học phần 5, "PY_HP3" cho Python học phần 3)

CÁCH TẠO subjectCode:
- Blockly Game HP5 → "BLG_HP5"
- Python HP3 → "PY_HP3"  
- Scratch HP2 → "SCR_HP2"
- AI HP1 → "AI_HP1"
- Web HP4 → "WEB_HP4"

Format JSON BẮT BUỘC (trả về đúng format này):
{
  "subjectCode": "VIẾT_TẮT_MÔN_HPX (vd: BLG_HP5)",
  "ma_lop": "mã lớp từ email",
  "cac_buoi": [
    {
      "buoi": 1,
      "ngay": "dd/MM/yyyy (vd: 07/11/2025)",
      "gio_bat_dau": "HH:mm (vd: 16:30)",
      "gio_ket_thuc": "HH:mm (vd: 18:00)",
      "noi_dung": "nội dung bài học (vd: Bài 1+2)"
    }
  ],
  "link_offset": "link nếu có, không có thì để ''"
}

Email cần phân tích:
"""
${emailText}
"""

Trả về JSON:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.1,
        topP: 0.8,
        topK: 10
      },
    }),
    muteHttpExceptions: true,
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    const textRes = res.getContentText();
    
    Logger.log("📥 Raw Gemini Response: " + textRes.substring(0, 500));
    
    const data = JSON.parse(textRes);
    
    if (data.error) {
      Logger.log("⚠️ Gemini API lỗi: " + JSON.stringify(data.error));
      return null;
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    Logger.log("📝 Gemini text output: " + text);
    
    if (!text) {
      Logger.log("❌ Gemini không trả về text");
      return null;
    }
    
    // Loại bỏ markdown code blocks nếu có
    let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Tìm JSON object
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      Logger.log("❌ Không tìm thấy JSON trong response");
      Logger.log("Text đã clean: " + cleanedText);
      return null;
    }
    
    const jsonText = jsonMatch[0];
    const parsedData = JSON.parse(jsonText);
    
    // Validate dữ liệu
    if (!parsedData.cac_buoi || !Array.isArray(parsedData.cac_buoi) || parsedData.cac_buoi.length === 0) {
      Logger.log("⚠️ JSON thiếu hoặc không có 'cac_buoi'");
      return null;
    }
    
    Logger.log("✅ Parse JSON thành công: " + JSON.stringify(parsedData));
    return parsedData;
    
  } catch (err) {
    Logger.log("❌ Lỗi phân tích Gemini: " + err.message);
    Logger.log("Stack: " + err.stack);
    return null;
  }
}

// ========== XỬ LÝ THỜI GIAN ==========
function parseVietnamDateTime(str) {
  if (!str) return new Date();

  let clean = str
    .toLowerCase()
    .replace(/h/g, ":")
    .replace(/ngày|thứ|,|\-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const dateMatch = clean.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  const timeMatch = clean.match(/(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) {
    Logger.log("⚠️ Không parse được thời gian từ: " + str);
    return new Date();
  }

  const [_, d, mo, y] = dateMatch;
  const [__, h, mi] = timeMatch;
  const dateStr = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}:00+07:00`;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    Logger.log("⚠️ Invalid Date parse: " + dateStr);
    return new Date();
  }
  return date;
}

/**
 * Kiểm tra mail đã có trong sheet chưa (dựa vào sender + time)
 */
function checkMailInSheet(sheet, msgId, sender, sentTime) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false; // Chỉ có header
  
  // Đọc tất cả dữ liệu từ cột A và B (Người gửi, Thời gian)
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  
  // Format thời gian để so sánh
  const sentTimeStr = Utilities.formatDate(sentTime, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
  
  for (let i = 0; i < data.length; i++) {
    const rowSender = data[i][0];
    const rowTime = data[i][1];
    
    // So sánh sender
    if (rowSender === sender) {
      // Nếu rowTime là Date object
      if (rowTime instanceof Date) {
        const rowTimeStr = Utilities.formatDate(rowTime, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
        if (rowTimeStr === sentTimeStr) {
          Logger.log(`✓ Mail đã tồn tại trong sheet tại dòng ${i + 2}`);
          return true;
        }
      }
      // Nếu rowTime là string
      else if (typeof rowTime === 'string' && rowTime === sentTime.toString()) {
        Logger.log(`✓ Mail đã tồn tại trong sheet tại dòng ${i + 2}`);
        return true;
      }
    }
  }
  
  return false;
}

// ========== TIỆN ÍCH ==========
/**
 * Reset toàn bộ processedIds - chỉ dùng khi cần xử lý lại tất cả mail
 * CẢNH BÁO: Sẽ xử lý lại TẤT CẢ mail offset trong 1 ngày!
 */
function resetProcessedIds() {
  const scriptProps = PropertiesService.getScriptProperties();
  const oldIds = JSON.parse(scriptProps.getProperty("processedIds") || "[]");
  
  scriptProps.deleteProperty("processedIds");
  Logger.log(`🗑️ Đã xóa ${oldIds.length} mail ID đã lưu. Script sẽ xử lý lại tất cả mail!`);
  SpreadsheetApp.getActiveSpreadsheet().toast(`⚠️ Đã reset! ${oldIds.length} mail sẽ được xử lý lại.`);
}

/**
 * Xem danh sách các mail ID đã xử lý
 */
function viewProcessedIds() {
  const scriptProps = PropertiesService.getScriptProperties();
  const processedIds = JSON.parse(scriptProps.getProperty("processedIds") || "[]");
  
  Logger.log(`📋 Có ${processedIds.length} mail đã xử lý:`);
  processedIds.forEach((id, index) => {
    Logger.log(`  ${index + 1}. ${id}`);
  });
  
  return processedIds;
}

/**
 * Xóa label khỏi TẤT CẢ mail offset để test lại
 */
function removeLabelFromAllOffsetMails() {
  const label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) {
    Logger.log("❌ Không tìm thấy label Offset_process");
    return;
  }

  const threads = label.getThreads();
  Logger.log(`🗑️ Đang xóa label khỏi ${threads.length} mail...`);
  
  for (const thread of threads) {
    thread.removeLabel(label);
  }
  
  Logger.log(`✅ Đã xóa label khỏi ${threads.length} mail`);
  SpreadsheetApp.getActiveSpreadsheet().toast(`✅ Đã xóa label khỏi ${threads.length} mail`);
}

/**
 * Đồng bộ lại TẤT CẢ data từ processedIds vào sheet
 * Dùng khi sheet bị xóa hoặc data bị mất
 */
function syncAllDataToSheet() {
  const scriptProps = PropertiesService.getScriptProperties();
  const processedIds = JSON.parse(scriptProps.getProperty("processedIds") || "[]");
  
  if (processedIds.length === 0) {
    Logger.log("❌ Không có mail đã xử lý trong bộ nhớ");
    SpreadsheetApp.getActiveSpreadsheet().toast("⚠️ Không có data để đồng bộ");
    return;
  }

  Logger.log(`🔄 Đồng bộ ${processedIds.length} mail vào sheet...`);
  
  const label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) {
    Logger.log("❌ Không tìm thấy label Offset_process");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  
  let syncCount = 0;
  const threads = label.getThreads();
  
  for (const thread of threads) {
    const msg = thread.getMessages()[0];
    const msgId = msg.getId();
    const sender = msg.getFrom();
    const sentTime = msg.getDate();
    
    // Kiểm tra đã có trong processedIds và chưa có trong sheet
    if (processedIds.includes(msgId) && !checkMailInSheet(sheet, msgId, sender, sentTime)) {
      const body = msg.getPlainBody();
      const data = extractOffsetData(body);
      
      if (data && data.cac_buoi?.length && data.subjectCode) {
        sheet.appendRow([sender, sentTime, JSON.stringify(data, null, 2), "✅ Đồng bộ lại"]);
        syncCount++;
        Logger.log(`✅ Đã đồng bộ mail: ${msg.getSubject()}`);
      } else {
        sheet.appendRow([sender, sentTime, "❌ Không parse được khi đồng bộ", "Lỗi"]);
        Logger.log(`⚠️ Không parse được mail: ${msg.getSubject()}`);
      }
    }
  }
  
  Logger.log(`✅ Đã đồng bộ ${syncCount}/${processedIds.length} mail vào sheet`);
  SpreadsheetApp.getActiveSpreadsheet().toast(`✅ Đã đồng bộ ${syncCount} mail vào sheet`);
}

/**
 * Reply all thông báo giáo viên đã được phân công (CC các giáo viên)
 * Chạy thủ công hoặc từ trigger khi có update giáo viên
 */
function replyWithTeacherAssignment() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    Logger.log("❌ Không tìm thấy sheet OffsetAI");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("⚠️ Sheet không có dữ liệu");
    return;
  }
  
  // Đọc tất cả data từ sheet
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  // Cột: A=Người gửi, B=Thời gian, C=JSON, D=Kết quả, E=Giáo viên, F=Email
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const sender = row[0];
    const sentTime = row[1];
    const jsonData = row[2];
    const result = row[3];
    const teachers = row[4];
    const emails = row[5];
    
    // Bỏ qua nếu không có JSON hoặc chưa parse được
    if (!jsonData || typeof jsonData !== 'string' || !jsonData.startsWith('{')) continue;
    
    // Bỏ qua nếu chưa có giáo viên
    if (!teachers || !emails) {
      Logger.log(`⏭️ Row ${i + 2}: Chưa có giáo viên, bỏ qua`);
      continue;
    }
    
    try {
      const data = JSON.parse(jsonData);
      const cacBuoi = data.cac_buoi || [];
      const maLop = data.ma_lop;
      
      if (cacBuoi.length === 0) continue;
      
      // Parse giáo viên và email (format: "15/11: GV A\n16/11: GV B")
      const teacherLines = teachers.split(/[\n,]/).map(t => t.trim()).filter(t => t);
      const emailLines = emails.split(/[\n,]/).map(e => e.trim()).filter(e => e);
      
      // Đếm số buổi có giáo viên
      const assignedDates = new Set();
      teacherLines.forEach(line => {
        const match = line.match(/^(\d{1,2}\/\d{1,2}):/);
        if (match) {
          assignedDates.add(match[1]);
        }
      });
      
      // Kiểm tra xem đã đủ giáo viên cho tất cả các buổi chưa
      if (assignedDates.size < cacBuoi.length) {
        Logger.log(`⏭️ Row ${i + 2}: Chỉ có ${assignedDates.size}/${cacBuoi.length} buổi có giáo viên, chưa reply`);
        continue;
      }
      
      // Kiểm tra xem đã reply chưa (cột D có chứa "✅ Đã gửi GV")
      if (result && result.includes("✅ Đã gửi GV")) {
        Logger.log(`⏭️ Row ${i + 2}: Đã reply giáo viên rồi, bỏ qua`);
        continue;
      }
      
      // Lấy danh sách email giáo viên
      const teacherEmails = [];
      emailLines.forEach(line => {
        const match = line.match(/^(\d{1,2}\/\d{1,2}):\s*(.+)$/);
        if (match && match[2] && match[2].includes('@')) {
          teacherEmails.push(match[2]);
        }
      });
      
      if (teacherEmails.length === 0) {
        Logger.log(`⚠️ Row ${i + 2}: Không tìm thấy email giáo viên hợp lệ`);
        continue;
      }
      
      // Tìm thread mail gốc
      const threads = GmailApp.search(`from:${sender} subject:offset newer_than:7d`);
      let foundThread = null;
      
      for (const thread of threads) {
        const msg = thread.getMessages()[0];
        const msgTime = msg.getDate();
        
        // So sánh thời gian (chênh lệch < 1 phút)
        if (Math.abs(msgTime.getTime() - new Date(sentTime).getTime()) < 60000) {
          foundThread = thread;
          break;
        }
      }
      
      if (!foundThread) {
        Logger.log(`⚠️ Row ${i + 2}: Không tìm thấy thread mail gốc`);
        continue;
      }
      
      // Tạo nội dung reply với format chi tiết
      let teacherList = '';
      for (let j = 0; j < cacBuoi.length; j++) {
        const buoi = cacBuoi[j];
        const buoiNgay = buoi.ngay; // format: dd/MM/yyyy
        const [day, month] = buoiNgay.split('/');
        const shortDate = `${parseInt(day)}/${parseInt(month)}`; // format: d/M
        
        // Tìm giáo viên cho buổi này
        let teacherName = 'Chưa phân công';
        teacherLines.forEach(line => {
          const match = line.match(/^(\d{1,2}\/\d{1,2}):\s*(.+)$/);
          if (match && match[1] === shortDate) {
            teacherName = match[2];
          }
        });
        
        teacherList += `<div style="font-size: 16px; margin: 8px 0;"><b>- Buổi ${j + 1}: Ngày ${buoi.ngay} (${buoi.gio_bat_dau} - ${buoi.gio_ket_thuc}) - Giáo viên: ${teacherName}</b></div>`;
      }
      
      const body = `
<div style="font-size: 14px; line-height: 1.6;">
<p>Dear all,</p>

<p>Bộ phận chuyên môn nhận thông tin và hỗ trợ sắp xếp giáo viên như sau:</p>

${teacherList}

<p>Các giáo viên đã được CC vào mail này. Vui lòng kiểm tra lịch và chuẩn bị bài giảng.</p>

<br>
<p>Trân trọng,<br>
Dương Thụ - [ST - Edtech]</p>
</div>
`;
      
      // Reply all và CC các giáo viên
      const firstMsg = foundThread.getMessages()[0];
      const ccList = teacherEmails.join(',');
      
      firstMsg.replyAll(body, {
        cc: ccList
      });
      
      Logger.log(`✅ Row ${i + 2}: Đã reply và CC ${teacherEmails.length} giáo viên cho lớp ${maLop}`);
      
      // Cập nhật cột D để đánh dấu đã reply
      sheet.getRange(i + 2, 4).setValue("✅ Đã gửi GV: " + new Date().toLocaleString('vi-VN'));
      
    } catch (err) {
      Logger.log(`❌ Row ${i + 2}: Lỗi xử lý - ${err.message}`);
      continue;
    }
  }
  
  Logger.log("✅ Hoàn thành kiểm tra và reply giáo viên");
  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Đã reply thông tin giáo viên cho các lớp đủ điều kiện");
}

/**
 * Kiểm tra và reply cho 1 lớp cụ thể (dùng khi vừa update giáo viên)
 * @param {string} className - Mã lớp cần kiểm tra
 */
function checkAndReplyForClass(className) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return;
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const jsonData = row[2];
    
    if (!jsonData || typeof jsonData !== 'string' || !jsonData.startsWith('{')) continue;
    
    try {
      const data = JSON.parse(jsonData);
      if (data.ma_lop === className) {
        // Tìm thấy lớp, gọi replyWithTeacherAssignment để xử lý
        Logger.log(`🔍 Tìm thấy lớp ${className} tại row ${i + 2}, kiểm tra điều kiện reply...`);
        replyWithTeacherAssignment();
        return;
      }
    } catch (err) {
      continue;
    }
  }
}
