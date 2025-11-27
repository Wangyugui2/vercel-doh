export const config = {
  runtime: 'edge', // 使用边缘节点，速度最快
};

// 默认配置：定义路径和目标 DoH 服务器
const PATH_MAPPINGS = {
  '/google': {
    targetDomain: 'dns.google',
    pathMapping: { '/query-dns': '/dns-query' }, // Google 的路径是 /dns-query
  },
  '/cloudflare': {
    targetDomain: '1.1.1.1',
    pathMapping: { '/query-dns': '/dns-query' },
  },
  '/adguard': {
    targetDomain: 'dns.adguard-dns.com',
    pathMapping: { '/query-dns': '/dns-query' },
  }
};

const HOMEPAGE_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Vercel DoH 代理服务</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        .box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        h3 { margin-top: 0; color: #0070f3; }
    </style>
</head>
<body>
    <h1>🚀 DoH 转发服务运行正常</h1>
    <p>这是一个运行在 Vercel Edge 上的 DNS over HTTPS 转发器。</p>
    
    <div class="box">
        <h3>Google DNS (推荐)</h3>
        <p>通用链接: <code>/google/query-dns</code></p>
        <p>完整示例: <code>https://你的域名.vercel.app/google/query-dns</code></p>
    </div>

    <div class="box">
        <h3>Cloudflare DNS</h3>
        <p>通用链接: <code>/cloudflare/query-dns</code></p>
    </div>
</body>
</html>
`;

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const queryString = url.search;

  // 1. 如果访问首页，返回 HTML 说明
  if (path === '/' || path === '/index.html') {
    return new Response(HOMEPAGE_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // 2. 查找匹配的路径前缀 (例如 /google)
  const pathPrefix = Object.keys(PATH_MAPPINGS).find((prefix) => path.startsWith(prefix));

  if (pathPrefix) {
    const mapping = PATH_MAPPINGS[pathPrefix];
    
    // 移除前缀，保留剩余路径
    const remainingPath = path.substring(pathPrefix.length);
    
    // 转换路径 (例如把 /query-dns 变成 /dns-query)
    let targetPath = remainingPath;
    for (const [source, dest] of Object.entries(mapping.pathMapping)) {
      if (remainingPath.startsWith(source)) {
        targetPath = remainingPath.replace(source, dest);
        break;
      }
    }

    // 3. 构建新的请求 URL
    const newUrl = `https://${mapping.targetDomain}${targetPath}${queryString}`;

    // 4. 发起转发请求
    const modifiedRequest = new Request(newUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    });

    // 5. 返回结果
    return fetch(modifiedRequest);
  }

  // 如果没有匹配到任何规则，返回首页
  return new Response(HOMEPAGE_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
