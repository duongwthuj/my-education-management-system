// ========== CONFIG ==========
const API_KEY = "AIzaSyASa710csmZBHZeRMkbEJ35ab0BXJvULxY";
const MODEL = "gemini-2.5-flash"; // Cập nhật model name chính xác
const LABEL_NAME = "Offset_process";
const SHEET_NAME = "OffsetAI";
const SCRIPT_PROP_KEY = "processedIds";

/**
 * HƯỚNG DẪN SỬ DỤNG (TỐI ƯU HÓA):
 * 
 * 1. runAll() - Function chính, đặt trigger chạy tự động (ví dụ: 5 phút/lần).
 * 2. Các hàm khác là hàm hỗ trợ, không cần chạy thủ công thường xuyên.
 */

// ========== MAIN ORCHESTRATOR ==========
function runAll() {
  console.time("runAll"); // Đo thời gian chạy
  Logger.log("🚀 BẮT ĐẦU CHẠY TỰ ĐỘNG - runAll()");

  try {
    // Bước 1: Xử lý mail offset mới
    processNewEmails();

    // Bước 2: Kiểm tra và reply thông tin giáo viên
    replyWithTeacherAssignment();

    Logger.log("✅ HOÀN THÀNH - runAll()");
  } catch (error) {
    Logger.log(`❌ LỖI trong runAll(): ${error.message}`);
    Logger.log(error.stack);
  }
  console.timeEnd("runAll");
}

// ========== CORE FUNCTIONS ==========

/**
 * Xử lý các email mới: Đọc, Phân tích AI, Ghi Sheet, Reply
 */
function processNewEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  // Init Header nếu chưa có
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Người gửi", "Thời gian gửi", "JSON dữ liệu", "Link Offset", "Kết quả phản hồi", "Giáo viên (Input)", "Email GV (Input)"]);
    sheet.setFrozenRows(1);
  }

  // 1. Load dữ liệu cache để check trùng lặp nhanh (O(1))
  const scriptProps = PropertiesService.getScriptProperties();
  const processedIds = new Set(JSON.parse(scriptProps.getProperty(SCRIPT_PROP_KEY) || "[]"));

  // Load dữ liệu hiện tại từ Sheet để check trùng (Sender + Time)
  const existingSignatures = getExistingSheetSignatures(sheet);

  // 2. Tìm mail (Search tối ưu hơn)
  // Chỉ tìm mail chưa có label để tránh đọc lại mail cũ không cần thiết
  // TEST MODE: Chỉ nhận mail từ duongthujob@gmail.com
  const threads = GmailApp.search(`subject:(offset) -label:${LABEL_NAME} newer_than:2d`);
  Logger.log(`📬 Tìm thấy ${threads.length} thread chưa xử lý label (TEST MODE: duongthujob@gmail.com).`);

  if (!threads.length) return;

  const label = GmailApp.getUserLabelByName(LABEL_NAME) || GmailApp.createLabel(LABEL_NAME);
  const rowsToAdd = [];
  const idsToMark = [];

  // 3. Xử lý từng thread
  for (const thread of threads) {
    const msgs = thread.getMessages();
    const msg = msgs[0]; // Chỉ lấy mail đầu tiên của thread
    const msgId = msg.getId();

    // Check cache ID nhanh
    if (processedIds.has(msgId)) {
      if (!thread.getLabels().some(l => l.getName() === LABEL_NAME)) {
        thread.addLabel(label); // Bổ sung label nếu thiếu
      }
      continue;
    }

    const sender = msg.getFrom();
    const sentTime = msg.getDate();
    const signature = `${sender}|${sentTime.getTime()}`;

    // Check trùng trong Sheet
    if (existingSignatures.has(signature)) {
      Logger.log(`⏩ Mail đã có trong sheet: ${msg.getSubject()}`);
      idsToMark.push(msgId);
      thread.addLabel(label);
      continue;
    }

    Logger.log(`🆕 Đang xử lý: ${msg.getSubject()}`);

    // Phân tích bằng AI
    const body = msg.getPlainBody();
    const data = extractOffsetDataWithRetry(body); // Có cơ chế retry

    let resultStatus = "⏳ Đang xử lý";
    let jsonString = "{}";
    let linkOffset = "";

    if (data && data.cac_buoi?.length) {
      jsonString = JSON.stringify(data, null, 2);
      linkOffset = data.link_offset || "";

      // Logic check 24h
      const buoiDau = data.cac_buoi[0];
      // Parse ngày từ format DD/MM/YYYY
      const [day, month, year] = buoiDau.ngay.split('/');
      const dateTimeHoc = new Date(year, month - 1, day, ...buoiDau.gio_bat_dau.split(':'));

      const diffHours = (dateTimeHoc.getTime() - sentTime.getTime()) / (1000 * 60 * 60);
      Logger.log(`   🕒 Diff: ${diffHours.toFixed(2)}h (Sent: ${sentTime}, Class: ${dateTimeHoc})`);

      if (diffHours < 24) {
        replyRejectMail(msg, sentTime, buoiDau.ngay, buoiDau.gio_bat_dau);
        resultStatus = "❌ Reject (<24h)";
      } else {
        replyConfirmMail(msg);
        resultStatus = "✅ Đã xác nhận";
      }
    } else {
      resultStatus = "❌ Lỗi parse AI";
      jsonString = JSON.stringify({ error: "Không trích xuất được dữ liệu", raw: body.substring(0, 200) });
    }

    // Thêm vào hàng đợi ghi
    rowsToAdd.push([sender, sentTime, jsonString, linkOffset, resultStatus, "", ""]);
    idsToMark.push(msgId);

    // Gán label ngay
    thread.addLabel(label);
  }

  // 4. Ghi Batch vào Sheet (Nhanh hơn ghi từng dòng)
  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, 7).setValues(rowsToAdd);
    Logger.log(`💾 Đã ghi thêm ${rowsToAdd.length} dòng vào Sheet.`);
  }

  // 5. Cập nhật Cache ID
  if (idsToMark.length > 0) {
    idsToMark.forEach(id => processedIds.add(id));
    scriptProps.setProperty(SCRIPT_PROP_KEY, JSON.stringify([...processedIds]));
  }
}

/**
 * Quét Sheet và gửi mail thông báo giáo viên (Batch Processing)
 */
function replyWithTeacherAssignment() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() <= 1) return;

  // Đọc toàn bộ dữ liệu 1 lần
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(2, 1, lastRow - 1, 7);
  const data = range.getValues();

  const updates = []; // Lưu các update để ghi lại vào sheet 1 lần

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    // Cột: 0=Sender, 1=Time, 2=JSON, 3=Link, 4=Result, 5=Teachers, 6=Emails
    const [sender, sentTime, jsonData, , result, teachers, emails] = row;

    // Điều kiện lọc nhanh:
    // 1. Phải có thông tin giáo viên (Cột F, G)
    // 2. Chưa gửi mail (Cột E chưa có "✅ Đã gửi GV")
    if (!teachers || !emails || (result && result.toString().includes("✅ Đã gửi GV"))) {
      // Logger.log(`⏩ Skip row ${i+2}: Teachers=${!!teachers}, Emails=${!!emails}, Result=${result}`);
      updates.push(null); // Không update dòng này
      continue;
    }

    try {
      const parsedData = JSON.parse(jsonData);
      const cacBuoi = parsedData.cac_buoi || [];

      // Validate số lượng giáo viên
      // Đếm số lượng dòng có chứa ngày tháng (format d/m hoặc dd/mm)
      const assignedCount = (teachers.match(/\d{1,2}\/\d{1,2}/g) || []).length;

      Logger.log(`🔍 Checking row ${i + 2}: assignedCount=${assignedCount}, required=${cacBuoi.length}`);

      if (assignedCount < cacBuoi.length) {
        Logger.log(`⚠️ Chưa đủ giáo viên cho row ${i + 2}. Có ${assignedCount}/${cacBuoi.length}`);
        updates.push(null); // Chưa đủ giáo viên
        continue;
      }

      // Gửi mail
      const success = sendAssignmentEmail(sender, sentTime, parsedData, teachers, emails);

      if (success) {
        const newStatus = result ? `${result} | ✅ Đã gửi GV` : `✅ Đã gửi GV: ${Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "HH:mm dd/MM")}`;
        updates.push(newStatus);
      } else {
        updates.push(null);
      }

    } catch (e) {
      Logger.log(`⚠️ Lỗi dòng ${i + 2}: ${e.message}`);
      updates.push(null);
    }
  }

  // Ghi update lại vào cột E (Result)
  // Chỉ ghi những dòng có thay đổi để tối ưu
  const newValues = updates.map((val, idx) => val ? [val] : [data[idx][4]]);

  // Kiểm tra xem có update nào không mới ghi
  const hasUpdates = updates.some(u => u !== null);
  if (hasUpdates) {
    sheet.getRange(2, 5, newValues.length, 1).setValues(newValues);
    Logger.log("💾 Đã cập nhật trạng thái gửi mail giáo viên vào Sheet.");
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Lấy danh sách chữ ký (Sender|Time) từ Sheet để check trùng nhanh
 */
function getExistingSheetSignatures(sheet) {
  const signatures = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return signatures;

  // Chỉ đọc 2 cột đầu
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (const row of data) {
    const time = row[1] instanceof Date ? row[1].getTime() : new Date(row[1]).getTime();
    signatures.add(`${row[0]}|${time}`);
  }
  return signatures;
}

/**
 * Gửi mail assignment logic tách riêng
 */
function sendAssignmentEmail(sender, sentTime, data, teachersStr, emailsStr) {
  // Extract email from sender "Name <email>" -> "email"
  const emailMatch = sender.match(/<([^>]+)>/);
  const senderEmail = emailMatch ? emailMatch[1] : sender;

  // Tìm thread gốc
  // Lưu ý: search chính xác theo sender email và time range nhỏ
  const threads = GmailApp.search(`from:${senderEmail} subject:offset newer_than:7d`);
  let targetThread = null;
  const targetTime = new Date(sentTime).getTime();

  for (const thread of threads) {
    const msgTime = thread.getMessages()[0].getDate().getTime();
    if (Math.abs(msgTime - targetTime) < 60000) { // Sai số 1 phút
      targetThread = thread;
      break;
    }
  }

  if (!targetThread) {
    Logger.log("❌ Không tìm thấy thread gốc để reply.");
    return false;
  }

  // Parse email list để CC
  const teacherEmails = [];
  emailsStr.split(/[\n,]/).forEach(line => {
    const match = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (match) teacherEmails.push(match[0]);
  });

  // Build nội dung
  let htmlBody = `<p>Dear all,</p>
  <p>Bộ phận chuyên môn nhận thông tin và hỗ trợ sắp xếp giáo viên như sau:</p>
  <ul>`;

  data.cac_buoi.forEach((buoi, index) => {
    // Tìm tên GV tương ứng trong chuỗi teachersStr
    // Giả định format: "dd/MM: Tên GV"
    // Normalize date: 01/12 -> 1/12 để khớp với format của backend
    const [day, month] = buoi.ngay.split('/');
    const dateShort = `${parseInt(day)}/${parseInt(month)}`;

    const teacherLine = teachersStr.split('\n').find(l => l.includes(dateShort)) || "Đang cập nhật";
    const teacherName = teacherLine.split(':')[1]?.trim() || teacherLine;

    htmlBody += `<li><strong>Buổi ${index + 1}:</strong> ${buoi.ngay} (${buoi.gio_bat_dau}-${buoi.gio_ket_thuc}) - <strong>${teacherName}</strong></li>`;
  });

  htmlBody += `</ul>
  <p>Các giáo viên đã được CC vào mail này. Vui lòng kiểm tra lịch và chuẩn bị bài giảng.</p>
  <p>Trân trọng,<br>Dương Thụ - [ST - Edtech]</p>`;

  targetThread.replyAll("", {
    htmlBody: htmlBody,
    cc: teacherEmails.join(',')
  });

  // Add label "Offset_add_name" after success
  const doneLabelName = "Offset_add_name";
  const doneLabel = GmailApp.getUserLabelByName(doneLabelName) || GmailApp.createLabel(doneLabelName);
  targetThread.addLabel(doneLabel);

  // Remove old label "Offset_process"
  const oldLabel = GmailApp.getUserLabelByName(LABEL_NAME);
  if (oldLabel) {
    targetThread.removeLabel(oldLabel);
  }

  return true;
}

function replyRejectMail(msg, sentTime, ngay, gio) {
  const body = `Dear all,

Bộ phận chuyên môn phản hồi:
Theo quy định, yêu cầu sắp xếp lớp offset cần được gửi trước ít nhất 24 giờ.
Mail được gửi lúc ${Utilities.formatDate(sentTime, "Asia/Ho_Chi_Minh", "HH:mm dd/MM/yyyy")} cho buổi học ${gio} ngày ${ngay} là chưa đáp ứng thời hạn.
Bộ phận chuyên môn xin phép từ chối yêu cầu này.

Trân trọng,
Dương Thụ - [ST - Edtech]`;
  msg.replyAll(body);
}

function replyConfirmMail(msg) {
  const body = `Dear all,

Bộ phận chuyên môn đã nhận được thông tin offset. BPCM sẽ sắp xếp giáo viên và phản hồi lại sớm nhất.

Trân trọng,
Dương Thụ - [ST - Edtech]`;
  msg.replyAll(body);
}

// ========== AI WRAPPER ==========

function extractOffsetDataWithRetry(text, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const result = extractOffsetData(text);
    if (result) return result;
    if (i < retries) Utilities.sleep(1000); // Wait 1s before retry
  }
  return null;
}

function extractOffsetData(emailText) {
  const prompt = `
  Trích xuất thông tin lớp học Offset từ email dưới đây thành JSON.
  
  QUY TẮC:
  1. "subjectCode": Tạo mã môn dựa trên danh sách chuẩn sau (kết hợp _HPx nếu có học phần):
     - BLG (Bé làm game)
     - SNLG (Siêu nhân làm game)
     - SNLT (Siêu nhân lập trình)
     - SNLTW (Siêu nhân lập trình web)
     - DSMM_2025 (DigiStyle Multimedia 2025)
     - DSMM (Multimedia)
     VD: BLG_HP5, SNLTW_HP3.
  2. "ngay": Format DD/MM/YYYY (VD: 05/12/2025).
  3. "gio_bat_dau", "gio_ket_thuc": Format HH:mm (24h).
  4. Chỉ trả về JSON thuần, không markdown.

  Email:
  """
  ${emailText}
  """

  JSON Output Template:
  {
    "subjectCode": "...",
    "ma_lop": "...",
    "link_offset": "...",
    "cac_buoi": [
      { "buoi": 1, "ngay": "DD/MM/YYYY", "gio_bat_dau": "HH:mm", "gio_ket_thuc": "HH:mm", "noi_dung": "..." }
    ]
  }
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1 }
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode !== 200) {
      Logger.log(`❌ API Error (${responseCode}): ${responseBody}`);
      return null;
    }

    const json = JSON.parse(responseBody);
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;

    Logger.log("🤖 AI Raw Response: " + rawText); // Log để debug

    if (!rawText) return null;

    // Improved cleanup: Tìm ngoặc nhọn đầu và cuối để lấy JSON chuẩn
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      Logger.log("❌ Không tìm thấy JSON trong phản hồi của AI");
      return null;
    }

    const cleanJson = rawText.substring(firstBrace, lastBrace + 1);
    return JSON.parse(cleanJson);
  } catch (e) {
    Logger.log("❌ Parse Error: " + e.message);
    return null;
  }
}

// ========== UTILS ==========
function resetProcessedIds() {
  PropertiesService.getScriptProperties().deleteProperty(SCRIPT_PROP_KEY);
  SpreadsheetApp.getActiveSpreadsheet().toast("Đã reset bộ nhớ cache!");
}
