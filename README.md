# 🤖 WG Manager Bot
WG Manager Bot 是一款專為 WireGuard VPN 管理設計的 Discord 機器人，使用 JavaScript 開發，方便你直接透過 Discord 管理你的 WireGuard 伺服器。
它不僅支援查詢伺服器狀態，還能快速建立、儲存與刪除用戶設定檔，包含名稱、效期與地區等資訊。
# 🔧 功能特色
- 檢查伺服器狀態
- 儲存用戶資料
- 定期清理到期用戶
- 建立用戶設定檔
  - 名稱
  - 效期
  - 地區
- 刪除用戶設定檔
# 🧱 技術架構
### 前端
- Discord.js (使用者互動層面)
### 後端
- Node.js (VPN等功能實現)
- JSON (資料儲存)
- Ansible (自動化腳本高效率遠端推送設定檔)
- Wireguard VPN (主要VPN服務)
- Wireguard Exporter (儲存公鑰對應的Peer)
# ⚙️ 運作流程
1. **指令觸發**
   - 使用者在 Discord 中透過 Bot 發出指令（`/vpn`），並輸入必要資料：
     - 用戶名稱
     - 使用效期
     - VPN 地區（台灣/日本/新加坡/南韓）
2. **資料處理**
   - Bot 擷取使用者的 Discord User ID 與指令參數。
   - 為該用戶生成一對 **WireGuard 公私鑰**。
   - 將用戶資訊與金鑰一併儲存至資料庫中。
     - 用戶資料儲存格式
      ```
        "401338547085866423": {
          "confname": "123",
          "leasetime": "7",
          "location": "新加坡",
          "PrivateKey": "ZSwu3H10bD5CAecJivgmTMp+Eq4txlRdi14RoscdQUM=",
          "PublicKey": "jIrK+AJKL9GURzH+e/jOMmYxtpEnM9iWN2Ok1vQCp3Q=",
          "createdAt": "2025/2/9 下午11:17:08"
        }
      ```
3. **設定檔更新**
   - 將生成的公鑰添加至Server端的WireGuard 用戶設定檔 `wg0.conf`。
   - 同步設定對應的 peer 設定 `peer.conf`。
   - 根據 `createdAT` 時間戳，每固定一段時間檢查用戶所設定的效期，自動刪除設定檔。
4. **配置同步**
   - Bot 將更新後的設定檔透過 **Ansible** 自動推送至所有 WireGuard 節點。
   - 確保所有節點都同步擁有最新的 peer 設定資訊。
5. **結果回傳**
   - Bot 透過 Discord ephemeral message將分配到的IP以及生成的私鑰傳給 Discord 使用者。
   - 用戶按照官方指南完成客戶端設定流程。
# 🛠️ 指令使用指南
- 檢查節點狀態
```
/node
```
![image](https://github.com/user-attachments/assets/52ca8590-b7d1-47be-a117-763a34fa29cb)
- 建立設定檔
```
/vpn <用戶名> <一天/七天> <台灣/日本/新加坡/南韓>
```
![image](https://github.com/user-attachments/assets/af113795-fadc-4e93-8bb1-5f5cf1b9d19b)
- 刪除設定檔
```
/delvpn <用戶 Discord ID>
```
