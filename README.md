# 🤖 WG Manager Bot
WG Manager Bot 是一款專為 WireGuard VPN 管理設計的 Discord 機器人，使用 JavaScript 開發，方便你直接透過 Discord 管理你的 WireGuard 伺服器。
它不僅支援查詢伺服器狀態，還能快速建立、儲存與刪除用戶設定檔，包含名稱、效期與地區等資訊。
# 🔧 功能特色
- 伺服器狀態
- 儲存用戶資料
- 建立用戶設定檔
  - 名稱
  - 效期
  - 地區
- 刪除用戶設定檔
# ⚙️ 運作流程
1. **指令觸發**
   - 使用者在 Discord 中透過 Bot 發出指令（`/vpn`），並輸入必要資料：
     - 用戶名稱
     - 使用效期
     - VPN 地區（如：JP、US、TW）
2. **資料處理**
   - Bot 擷取使用者的 Discord User ID 與指令參數。
   - 為該用戶生成一對 **WireGuard 公私鑰**。
   - 將用戶資訊與金鑰一併儲存至資料庫中。
     - 用戶資料儲存格式
      ```
        "401339547083866123": {
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
4. **配置同步**
   - Bot 將更新後的設定檔透過 **Ansible** 自動推送至所有 WireGuard 節點。
   - 確保所有節點都同步擁有最新的 peer 設定資訊。
5. **結果回傳**
   - Bot 以私訊方式將生成的公私鑰發送給 Discord 使用者，再按照官方指南完成客戶端設定流程。
# 🛠️ 指令使用指南
```
/status              👉 查看 WireGuard 伺服器狀態
/add-user            👉 建立新的使用者設定檔
  ├─ 名稱
  ├─ 效期（例如：7天、30天）
  └─ 地區（例如：JP、US、TW）
/delete-user         👉 刪除指定用戶
/list-users          👉 列出所有使用者
```
