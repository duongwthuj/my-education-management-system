// ========== CONFIG ==========
const API_KEY = "AIzaSyAB6EYIc9FZFGeWJTo73yI700UPIDYojws";
const MODEL = "gemini-2.5-flash";
const LABEL_NAME = "Offset_process";
const SHEET_NAME = "OffsetAI";
const BACKEND_API_URL = "http://localhost:5000/api/offset-classes"; // Thay đổi URL này theo môi trường của bạn

// ========== MAIN FUNCTION ==========
function main() {
  const label = GmailApp.getUserLabelByName(LABEL_NAME) || GmailApp.createLabel(LABEL_NAME);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Người gửi", "Thời gian gửi", "JSON dữ liệu", "Kết quả phản hồi", "Giáo viên"]);
  }

  const scriptProps = PropertiesService.getScriptProperties();
  const processedIds = JSON.parse(scriptProps.getProperty("processedIds") || "[]");

  const threads = GmailApp.search('subject:(offset) newer_than:1d -label:Offset_process');

  if (!threads.length) {
    Logger.log("Không có mail offset mới.");
    return;
  }

  for (const thread of threads) {
    const msg = thread.getMessages()[0];
    const msgId = msg.getId();

    // 🔒 Bỏ qua nếu đã xử lý
    if (processedIds.includes(msgId)) {
      Logger.log(`⏩ Bỏ qua mail đã xử lý: ${msg.getSubject()}`);
      continue;
    }

    thread.addLabel(label);
    const sender = msg.getFrom();
    const sentTime = msg.getDate();
    const body = msg.getPlainBody();

    const data = extractOffsetData(body);
    if (!data || !data.cac_buoi?.length || !data.subjectCode) {
      sheet.appendRow([sender, sentTime, "❌ Không trích xuất được dữ liệu", "Không phản hồi"]);
      processedIds.push(msgId);
      continue;
    }

    // Ghi JSON ra sheet
    sheet.appendRow([sender, sentTime, JSON.stringify(data, null, 2), "⏳ Đang xử lý"]);

    const buoiDau = data.cac_buoi[0];
    const ngayHoc = buoiDau.ngay;
    const gioHoc = buoiDau.gio_bat_dau;
    const dateTimeHoc = parseVietnamDateTime(`${ngayHoc} ${gioHoc}`);

    if (!dateTimeHoc || isNaN(dateTimeHoc.getTime())) {
      Logger.log("⚠️ Không tính được thời gian học");
      sheet.appendRow([sender, sentTime, JSON.stringify(data, null, 2), "⚠️ Lỗi thời gian"]);
      processedIds.push(msgId);
      continue;
    }

    const diffHours = (dateTimeHoc.getTime() - sentTime.getTime()) / (1000 * 60 * 60);
    Logger.log(`📅 Gửi: ${Utilities.formatDate(sentTime, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm")} → Học: ${ngayHoc} ${gioHoc} (${diffHours.toFixed(2)}h)`);

    // let result = "";
    // if (diffHours < 24) {
    //   replyRejectMail(msg, sentTime, ngayHoc, gioHoc);
    //   result = "❌ Reject (<24h)";
    // } else {
    //   replyConfirmMail(msg);
    //   result = "✅ Đã xác nhận";
    // }

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setValue(result);

    // 🔒 Đánh dấu đã xử lý
    processedIds.push(msgId);
  }

  // Lưu danh sách ID đã xử lý
  scriptProps.setProperty("processedIds", JSON.stringify(processedIds));

  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Đã xử lý toàn bộ mail offset!");
}

// ========== PHẢN HỒI ==========
// function replyRejectMail(msg, sentTime, ngay, gio) {
//   const body = `
// Dear all,

// Bộ phận chuyên môn phản hồi:

// Theo quy định, yêu cầu sắp xếp lớp offset cần được gửi trước ít nhất 24 giờ so với thời gian buổi học.
// Các yêu cầu gửi sau 21h sẽ được tính là gửi vào lúc 8h sáng ngày hôm sau.

// Mail được gửi lúc ${Utilities.formatDate(sentTime, "Asia/Ho_Chi_Minh", "HH'h'mm dd/MM/yyyy")} cho buổi học ${gio} ngày ${ngay}, nên không đáp ứng thời hạn quy định.
// Bộ phận chuyên môn xin phép từ chối yêu cầu này và đề nghị gửi lại lịch học mới theo đúng quy định.

// Trân trọng,
// Dương Thụ - [ST - Edtech]
// `;
//   msg.replyAll(body);
//   Logger.log(`📩 Đã replyAll từ chối: ${msg.getSubject()}`);
// }

// function replyConfirmMail(msg) {
//   const body = `
// Dear all,

// Bộ phận chuyên môn đã nhận được thông tin offset. BPCM sẽ sắp xếp giáo viên và phản hồi lại luồng mail sớm nhất để buổi học diễn ra thuận lợi.

// Trân trọng,
// Dương Thụ - [ST - Edtech]
// `;
//   msg.replyAll(body);
//   Logger.log(`📩 Đã replyAll xác nhận: ${msg.getSubject()}`);
// }

// ========== PHÂN TÍCH EMAIL ==========
function extractOffsetData(emailText) {
  const prompt = `
Bạn là trợ lý phân tích email offset của trung tâm Teky. Hãy trích xuất CHÍNH XÁC thông tin từ email và trả về ĐÚNG format JSON dưới đây.

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


 