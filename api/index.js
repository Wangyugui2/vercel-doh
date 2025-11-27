export const config = {
  runtime: 'edge', // 使用边缘节点，速度极快
};

// 默认路径映射配置
// 你可以在这里添加更多上游 DoH，例如 Quad9 或 OpenDNS
const PATH_MAPPINGS = {
  '/google': {
    targetDomain: 'dns.google',
    pathMapping: { '/query-dns': '/dns-query' },
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

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const queryString = url.search;

  // 1. 获取环境变量中的密码
  // 如果没有设置环境变量，为了安全，直接报错
  const token = process.env.DNS_TOKEN;
  if (!token) {
    return new Response("Server Error: DNS_TOKEN not set in Vercel Settings.", { status: 500 });
  }

  // 2. 安全检查：验证路径是否以密码开头
  // 格式应该是: /你的密码/google/query-dns
  if (!path.startsWith(`/${token}`)) {
    // 密码不正确或未提供，返回 404 伪装成网页不存在 (隐身模式)
    return new Response("Not Found", { status: 404 });
  }

  // 3. 提取真实路径
  // 移除密码部分: /你的密码/google/query-dns -> /google/query-dns
  const realPath = path.replace(`/${token}`, '');

  // 4. 查找匹配的规则
  const pathPrefix = Object.keys(PATH_MAPPINGS).find((prefix) => realPath.startsWith(prefix));

  if (pathPrefix) {
    const mapping = PATH_MAPPINGS[pathPrefix];
    
    // 移除前缀，获取剩余路径
    const remainingPath = realPath.substring(pathPrefix.length);
    
    // 路径替换 (例如把客户端请求的 /query-dns 变成 Google 需要的 /dns-query)
    let targetPath = remainingPath;
    for (const [source, dest] of Object.entries(mapping.pathMapping)) {
      if (remainingPath.startsWith(source)) {
        targetPath = remainingPath.replace(source, dest);
        break;
      }
    }

    // 5. 构建上游 DoH 请求
    const newUrl = `https://${mapping.targetDomain}${targetPath}${queryString}`;

    const modifiedRequest = new Request(newUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    });

    // 6. 转发并返回结果
    return fetch(modifiedRequest);
  }

  // 路径虽有密码但没有匹配到 google/cloudflare 等规则
  return new Response("Invalid DoH Provider", { status: 400 });
}
