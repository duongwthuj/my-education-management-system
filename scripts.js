// ========== CONFIG ==========
const MODEL = "gemini-1.5-flash"; // Sử dụng stable model

// ... (keep existing code)

function extractOffsetData(emailText) {
  const prompt = `
  Bạn là một trợ lý AI xử lý dữ liệu. Nhiệm vụ của bạn là trích xuất thông tin lịch học Offset từ nội dung email dưới đây và trả về định dạng JSON CHUẨN.

  NỘI DUNG EMAIL:
  """
  ${emailText}
  """

  YÊU CẦU OUTPUT (JSON):
  {
    "subjectCode": "Mã môn học (VD: TEKY_C_PA_1518_SNLT_0004 -> SNLT, hoặc map từ tên khóa học: 'Siêu nhân lập trình' -> 'SNLT', 'Bé làm game' -> 'BLG', 'Web' -> 'SNLTW')",
    "ma_lop": "Mã lớp đầy đủ tìm thấy trong mail (VD: TE-C-PA-1518-SNLT-0004)",
    "link_offset": "Link họp online/Zoom/Meet nếu có (nếu không có để trống)",
    "cac_buoi": [
      {
        "buoi": 1, 
        "ngay": "DD/MM/YYYY", 
        "gio_bat_dau": "HH:mm", 
        "gio_ket_thuc": "HH:mm", 
        "noi_dung": "Nội dung buổi học nếu có"
      }
    ]
  }

  QUY TẮC QUAN TRỌNG:
  1. Chỉ trả về duy nhất chuỗi JSON. Không Markdown, không giải thích.
  2. Nếu không tìm thấy thông tin ngày giờ, trả về null.
  3. Định dạng ngày phải là DD/MM/YYYY.
  4. Định dạng giờ phải là HH:mm (24h).
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
