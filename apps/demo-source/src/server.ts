import Fastify from 'fastify';

const fastify = Fastify({ logger: false });

let currentVersion: 1 | 2 = 1;

const DOC_V1_CONTENT = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Thông tư 01/2026/TT-DEMO - Cổng Thông Tin Pháp Luật Demo</title>
</head>
<body>
  <div class="watermark">[SYNTHETIC DEMO DATA - NOT REAL LAW]</div>
  <header>
    <p>BỘ TÀI CHÍNH</p>
    <p>Số: 01/2026/TT-DEMO</p>
    <p>Hà Nội, ngày 15 tháng 01 năm 2026</p>
  </header>

  <article>
    <h1>THÔNG TƯ</h1>
    <h2>Quy định thủ tục hành chính hải quan điện tử</h2>

    <p>Căn cứ Luật Hải quan số 54/2014/QH13;</p>
    <p>Bộ trưởng Bộ Tài chính ban hành Thông tư hướng dẫn như sau:</p>

    <h3>Chương I: NHỮNG QUY ĐỊNH CHUNG</h3>

    <h4>Điều 1. Phạm vi điều chỉnh</h4>
    <p>Thông tư này quy định về hồ sơ và thủ tục hải quan điện tử đối với hàng hóa xuất nhập khẩu thương mại.</p>

    <h4>Điều 5. Hồ sơ hải quan</h4>
    <p>1. Hồ sơ gồm giấy A.</p>
    <p>2. Thời hạn xử lý là 10 ngày.</p>

    <h4>Điều 6. Phương thức nộp hồ sơ</h4>
    <p>Doanh nghiệp nộp hồ sơ trực tiếp.</p>

    <p>Thông tư này có hiệu lực thi hành từ ngày 01 tháng 03 năm 2026.</p>
  </article>

  <footer>
    <p>Nơi nhận: Các Cục Hải quan tỉnh; Lưu VT.</p>
    <p>BỘ TRƯỞNG</p>
  </footer>
</body>
</html>
`.trim();

const DOC_V2_CONTENT = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Thông tư 01/2026/TT-DEMO (Sửa đổi) - Cổng Thông Tin Pháp Luật Demo</title>
</head>
<body>
  <div class="watermark">[SYNTHETIC DEMO DATA - NOT REAL LAW]</div>
  <header>
    <p>BỘ TÀI CHÍNH</p>
    <p>Số: 01/2026/TT-DEMO</p>
    <p>Hà Nội, ngày 15 tháng 01 năm 2026</p>
  </header>

  <article>
    <h1>THÔNG TƯ</h1>
    <h2>Quy định thủ tục hành chính hải quan điện tử (Đã sửa đổi bổ sung)</h2>

    <p>Căn cứ Luật Hải quan số 54/2014/QH13;</p>
    <p>Bộ trưởng Bộ Tài chính ban hành Thông tư hướng dẫn như sau:</p>

    <h3>Chương I: NHỮNG QUY ĐỊNH CHUNG</h3>

    <h4>Điều 1. Phạm vi điều chỉnh</h4>
    <p>Thông tư này quy định về hồ sơ và thủ tục hải quan điện tử đối với hàng hóa xuất nhập khẩu thương mại.</p>

    <h4>Điều 5. Hồ sơ hải quan</h4>
    <p>1. Hồ sơ gồm giấy A và giấy B.</p>
    <p>2. Thời hạn xử lý là 5 ngày.</p>
    <p>3. Doanh nghiệp phải lưu hồ sơ trong 3 năm.</p>

    <h4>Điều 6. Phương thức nộp hồ sơ</h4>
    <p>Doanh nghiệp có thể nộp hồ sơ điện tử.</p>

    <p>Thông tư này có hiệu lực thi hành từ ngày 01 tháng 03 năm 2026.</p>
  </article>

  <footer>
    <p>Nơi nhận: Các Cục Hải quan tỉnh; Lưu VT.</p>
    <p>BỘ TRƯỞNG</p>
  </footer>
</body>
</html>
`.trim();

const DOC_V2_DECREE = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Nghị định 02/2026/NĐ-DEMO</title>
</head>
<body>
  <div class="watermark">[SYNTHETIC DEMO DATA - NOT REAL LAW]</div>
  <header>
    <p>CHÍNH PHỦ</p>
    <p>Số: 02/2026/NĐ-DEMO</p>
    <p>Hà Nội, ngày 20 tháng 02 năm 2026</p>
  </header>
  <article>
    <h1>NGHỊ ĐỊNH</h1>
    <h2>Quy định về quản lý rủi ro trong hoạt động hải quan</h2>
    <h4>Điều 1. Phạm vi</h4>
    <p>Nghị định này thay thế Nghị định số 08/2015/NĐ-CP.</p>
    <h4>Điều 2. Nguyên tắc áp dụng</h4>
    <p>1. Phân luồng kiểm tra hải quan theo mức độ tuân thủ của doanh nghiệp.</p>
    <p>2. Ưu tiên doanh nghiệp tuân thủ cao.</p>
  </article>
</body>
</html>
`.trim();

const DOC_V3_DECISION = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Quyết định 03/2025/QĐ-DEMO</title>
</head>
<body>
  <div class="watermark">[SYNTHETIC DEMO DATA - NOT REAL LAW]</div>
  <header>
    <p>THỦ TƯỚNG CHÍNH PHỦ</p>
    <p>Số: 03/2025/QĐ-DEMO</p>
    <p>Hà Nội, ngày 10 tháng 05 năm 2025</p>
  </header>
  <article>
    <h1>QUYẾT ĐỊNH</h1>
    <h2>Kế hoạch chuyển đổi số ngành hải quan giai đoạn thí điểm</h2>
    <h4>Điều 1. Mục tiêu</h4>
    <p>Thực hiện số hóa 100% hồ sơ hải quan trong năm 2025.</p>
    <p>Văn bản này hết hiệu lực thi hành kể từ ngày 31 tháng 12 năm 2025.</p>
  </article>
</body>
</html>
`.trim();

// Construct minimal valid PDF binary with legal text
function createMinimalPdf(): Buffer {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 12 Tf
72 712 Td
(THONG TU DEMO 04/2026/TT-DEMO - SYNTHETIC DATA NOT REAL LAW) Tj
0 -20 Td
(Dieu 1. Quy dinh huong dan bang PDF ve thu tuc hai quan.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000202 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
372
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

// 1. Home / Listing Page
fastify.get('/', async (_req, reply) => {
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Cổng Công Báo Pháp Luật Việt Nam (Synthetic Demo)</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
    .watermark { background: #fef3c7; color: #92400e; padding: 10px 16px; border-radius: 6px; margin-bottom: 24px; font-weight: bold; border-left: 4px solid #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-size: 13px; text-transform: uppercase; color: #64748b; }
    a { color: #2563eb; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    .controls { background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; }
    button { padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="watermark">[SYNTHETIC DEMO DATA - NOT REAL LAW] Cổng thông tin giả lập cho RegTracker Portfolio</div>
  <h1>Hệ Thống Văn Bản Quy Phạm Pháp Luật (Demo Server)</h1>
  <p>Máy chủ mô phỏng nguồn dữ liệu pháp luật phục vụ crawl, phát hiện phiên bản và so sánh thay đổi.</p>

  <div class="controls">
    <strong>Phiên bản hiện tại của Thông tư 01/2026/TT-DEMO:</strong>
    <span class="badge">Version ${currentVersion}</span>
    <form style="display:inline; margin-left: 12px;" action="/api/toggle-version" method="GET">
      <input type="hidden" name="version" value="${currentVersion === 1 ? 2 : 1}">
      <button type="submit">Chuyển sang Version ${currentVersion === 1 ? 2 : 1}</button>
    </form>
  </div>

  <h2>Danh sách văn bản mới ban hành</h2>
  <div class="listing-container">
    <table>
      <thead>
        <tr>
          <th>Số hiệu</th>
          <th>Trích yếu</th>
          <th>Cơ quan ban hành</th>
          <th>Ngày ban hành</th>
        </tr>
      </thead>
      <tbody>
        <tr class="doc-item">
          <td class="item-number">01/2026/TT-DEMO</td>
          <td><a class="item-link" href="/docs/01-2026-tt-demo">Thông tư DEMO 01/2026/TT-DEMO về thủ tục hải quan điện tử</a></td>
          <td>Bộ Tài chính</td>
          <td class="item-date">15/01/2026</td>
        </tr>
        <tr class="doc-item">
          <td class="item-number">02/2026/NĐ-DEMO</td>
          <td><a class="item-link" href="/docs/02-2026-nd-demo">Nghị định DEMO 02/2026/NĐ-DEMO về quản lý rủi ro hải quan</a></td>
          <td>Chính phủ</td>
          <td class="item-date">20/02/2026</td>
        </tr>
        <tr class="doc-item">
          <td class="item-number">03/2025/QĐ-DEMO</td>
          <td><a class="item-link" href="/docs/03-2025-qd-demo">Quyết định DEMO 03/2025/QĐ-DEMO về chuyển đổi số hải quan</a></td>
          <td>Thủ tướng Chính phủ</td>
          <td class="item-date">10/05/2025</td>
        </tr>
        <tr class="doc-item">
          <td class="item-number">04/2026/TT-DEMO</td>
          <td><a class="item-link" href="/docs/sample.pdf">Thông tư DEMO 04/2026/TT-DEMO (Định dạng PDF)</a></td>
          <td>Bộ Tài chính</td>
          <td class="item-date">01/03/2026</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
  reply.header('content-type', 'text/html; charset=utf-8');
  return html;
});

// 2. Document 01/2026/TT-DEMO
fastify.get('/docs/01-2026-tt-demo', async (req, reply) => {
  const query = req.query as { version?: string };
  const ver = query.version ? (parseInt(query.version, 10) as 1 | 2) : currentVersion;
  const content = ver === 2 ? DOC_V2_CONTENT : DOC_V1_CONTENT;

  reply.header('content-type', 'text/html; charset=utf-8');
  reply.header('etag', `"tt-01-2026-v${ver}"`);
  return content;
});

// 3. Document 02/2026/NĐ-DEMO
fastify.get('/docs/02-2026-nd-demo', async (_req, reply) => {
  reply.header('content-type', 'text/html; charset=utf-8');
  return DOC_V2_DECREE;
});

// 4. Document 03/2025/QĐ-DEMO
fastify.get('/docs/03-2025-qd-demo', async (_req, reply) => {
  reply.header('content-type', 'text/html; charset=utf-8');
  return DOC_V3_DECISION;
});

// 5. PDF fixture
fastify.get('/docs/sample.pdf', async (_req, reply) => {
  reply.header('content-type', 'application/pdf');
  reply.header('content-disposition', 'inline; filename="sample.pdf"');
  return createMinimalPdf();
});

// 6. Version Toggle API
fastify.all('/api/toggle-version', async (req, reply) => {
  const query = req.query as { version?: string };
  if (query.version) {
    currentVersion = parseInt(query.version, 10) === 2 ? 2 : 1;
  } else {
    currentVersion = currentVersion === 1 ? 2 : 1;
  }

  const referer = req.headers['referer'];
  if (referer && !referer.includes('/api/')) {
    return reply.redirect(referer);
  }

  return { success: true, currentVersion, message: `Switched demo source to Version ${currentVersion}` };
});

// 7. Current Version API
fastify.get('/api/current-version', async () => {
  return { currentVersion };
});

const PORT = parseInt(process.env.DEMO_SOURCE_PORT || '5101', 10);
const HOST = '0.0.0.0';

fastify.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`[RegTracker Demo Source] running at ${address} on port ${PORT}`);
});
