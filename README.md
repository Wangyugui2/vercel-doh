# Vercel Secure DoH Proxy (小白部署指南)

这是一个运行在 Vercel 上的安全 DNS over HTTPS (DoH) 转发服务。
它可以帮助你在国内安全、快速地使用 Google 或 Cloudflare 的 DNS 服务，解决 DNS 污染问题。

**特点：**
*   ⚡ **速度快**：基于 Vercel Edge Network。
*   🔒 **安全**：使用环境变量设置“路径密码”，防止服务被他人盗用。
*   🕵️ **隐身**：不知道密码的人访问只会看到 404 错误。

---

## 🛠️ 第一步：部署到 Vercel

### 1. 准备代码
1.  注册/登录 [GitHub](https://github.com/)。
2.  创建一个新的仓库（Repository），例如命名为 `private-doh`。
3.  上传（或创建）以下两个文件到仓库：
    *   `vercel.json`
    *   `api/index.js`
    *(代码内容请见上文)*

### 2. 导入到 Vercel
1.  注册/登录 [Vercel](https://vercel.com/)。
2.  在 Dashboard 点击 **"Add New..."** -> **"Project"**。
3.  在 "Import Git Repository" 列表中找到你刚才创建的 GitHub 仓库，点击 **Import**。

### 3. ⭐ 设置密码 (关键步骤)
在部署页面（Configure Project）中：
1.  找到 **"Environment Variables"** (环境变量) 区域并展开。
2.  填写以下内容：
    *   **Key**: `DNS_TOKEN`
    *   **Value**: `这里填一个复杂的密码` (例如: `MySecretKey2025`，只能包含字母和数字)
3.  点击 **Add** 按钮。
4.  最后点击底部的 **Deploy** 按钮。

等待几十秒，当屏幕放烟花时，部署就成功了！点击 **Continue to Dashboard**，你会看到你的 `Domains` (例如: `https://private-doh.vercel.app`)。

---

## 🔗 第二步：获取你的 DoH 链接

你的链接格式如下：
`https://你的域名/你的密码/服务商/query-dns`

假设：
*   域名: `private-doh.vercel.app`
*   密码 (`DNS_TOKEN`): `MySecretKey2025`

**你的可用地址列表：**

*   **Google (推荐)**:
    `https://private-doh.vercel.app/MySecretKey2025/google/query-dns`
*   **Cloudflare**:
    `https://private-doh.vercel.app/MySecretKey2025/cloudflare/query-dns`

---

## 📱 第三步：客户端设置指南

### Windows - v2rayN
1.  点击顶部 **"设置"** -> **"参数设置"**。
2.  选择 **"DNS 设置"** 选项卡。
3.  在 **"国外 DNS"** 输入框中，填入你的 Google 链接。
4.  点击确定，主界面点击 **"重启服务"**。

### Android - v2rayNG
1.  点击左上角菜单 -> **"设置"**。
2.  找到 **"预定义 DNS 服务器"**。
3.  填入你的 Google 链接。
4.  断开并重新连接 VPN。

### iOS/Mac/PC - Karing
1.  进入 **"设置"** -> **"路由与 DNS"**。
2.  在 **"远程 DNS"** (Remote DNS) 处选择自定义 (Custom)。
3.  类型选择 **DoH**，URL 填入你的 Google 链接。

### Linux 服务器 (Ubuntu/Debian) - Xray/Sing-box
修改你的配置文件（通常是 `config.json`），在 DNS 部分填入：

```json
"dns": {
  "servers": [
    "https://private-doh.vercel.app/MySecretKey2025/google/query-dns",
    "1.1.1.1"
  ]
}
```

---

## ❓ 常见问题

**Q: 我直接在浏览器访问我的域名，显示 404？**
A: **这是正常的！** 因为你没有在 URL 里输入正确的密码。这是为了防止别人扫描到你的服务。只有带上密码路径才能正常工作。

**Q: 想要修改密码怎么办？**
A: 在 Vercel 后台 -> 项目 Settings -> Environment Variables，找到 `DNS_TOKEN`，点击编辑，修改 Value，保存。**然后去 Deployments 页面，点击 Redeploy (重新部署) 才会生效。**

**Q: 为什么不用 `8.8.8.8`？**
A: 在国内直接访问 `8.8.8.8` 会被干扰。使用这个 Vercel 转发服务，相当于通过 HTTPS 隧道访问 DNS，防火墙无法识别你在做 DNS 查询，从而获得准确的国外 IP，防止 DNS 污染。
