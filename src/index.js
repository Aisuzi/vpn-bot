const configfile = require('../config.json');
const {Client, IntentsBitField, Events, AuditLogEvent, EmbedBuilder, InteractionResponseFlags, Message} = require('discord.js');
const fs = require('fs');
const { stringify } = require('querystring');
const crypto = require('crypto')
const nacl = require('tweetnacl');
const { exec } = require('child_process');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
    ],
});

const auth = Buffer.from(`${configfile.username}:${configfile.password}`).toString('base64');

const data_file = 'created-server-info.json';
function readData() {
    if (!fs.existsSync(data_file)) return{};
    return JSON.parse(fs.readFileSync(data_file, 'utf-8'));
}

function writeData(data) {
    try {
        fs.writeFileSync(data_file, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ 寫入資料時發生錯誤:', error);
    }
}


// vpn指令
client.on(Events.InteractionCreate, async (interaction) => {
    
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vpn'){
        
        function generatepravitekey() {
            return crypto.randomBytes(32)
        }

        function generatepublickey(pravitekey) {
            return nacl.box.keyPair.fromSecretKey(pravitekey).publicKey
        }

        function tobase64(buffer){
            return Buffer.from(buffer).toString('base64')
        }
        const iprangestart = 50
        const iprangeend = 100
        const baseip = '192.168.22.'
        
        function findavailableip(serverData){
            const usedips = new Set(Object.values(serverData).map(v => v.ip).filter(Boolean))
        
            if (usedips.size === 0){
                return `${baseip}${iprangestart}`
            }

            for (let i = iprangestart; i <= iprangeend; i++) {
                const candidateip = `${baseip}${i}`;
                if (!usedips.has(candidateip)) {
                    return candidateip;
                }
            }

            return null
        }
        const userid = interaction.user.id.toString();
        const confname = interaction.options.get('名稱')?.value;
        const leasetime = interaction.options.get('租用效期')?.value;
        
        let serverData = readData();

        if(serverData[userid]) {
            await interaction.reply({
                content:`❌ 你已經創建過節點請關閉 \*\*${serverData[userid].confname}\*\* 或 等待`,
                ephemeral: false,
            })
        } else{
            const newip = findavailableip(serverData)
            if (!newip){
                return await interaction.reply({
                    content: '⚠️ 所有 IP 已被分配，請聯繫管理員！',
                    ephemeral: false,
                })
            }
            const prikey = generatepravitekey()
            const pubkey = generatepublickey(prikey)
            const PrivateKey = tobase64(prikey)
            const PublicKey = tobase64(pubkey)
            serverData[userid] = {
                confname, 
                leasetime, 
                PrivateKey, 
                PublicKey,
                ip: newip, 
                createdAt: new Date().toLocaleString()
            };
            writeData(serverData);



            try{
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('✅ 成功創建節點')
                    .addFields(
                        { name: '名稱', value: confname, inline: true },
                        { name: '租用期限', value: `${leasetime}天`, inline: true },
                        { name: '私鑰', value: `\`\`${PrivateKey}\`\``, inline: false },
                        { name: 'IP', value: `\`\`${newip}\`\``, inline: false },

                    )
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: false,
                })
                } catch (error){
                    console.log(error)
                }
            const serverconfig = `
[Interface]
Address = 192.168.22.1/24
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ens4 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ens4 -j MASQUERADE
ListenPort = 61250
PrivateKey = QOc6nyOS4QcB6Z++vH+t8ajZnfzMDLPqlePTZZivOlI=
            `
            const peerconfig = Object.values(serverData)
                .map(user => `
[Peer]
PublicKey = ${user.PublicKey}
AllowedIPs = ${user.ip}
                `)
                .join('')
            const finalconfig = serverconfig + peerconfig
            const conffile = '/config/wg0.conf'
            fs.writeFileSync(conffile, finalconfig.trim(), 'utf-8')

            const peertomlconfig = Object.values(serverData)
                .map(user => `
[[peer]]
public_key = "${user.PublicKey}"
name = "${user.confname}"
                `)
                .join('')
            
            const peertomlfile = '/config/peer.toml'
            fs.writeFileSync(peertomlfile, peertomlconfig.trim(), 'utf-8')
        }
            exec('sudo /usr/bin/ansible-playbook /etc/ansible/playbooks/update.yml')
        
        

        // interaction.reply('還沒做好!')

        // console.log(confname)
        // console.log(leasetime)
        // console.log(location)
    }
});
// node指令
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'node') {
        let server_info = [
            {server: "taiwan", url: "tw", state: "🔴 Offline"},
            {server: "japan", url: "jp", state: "🔴 Offline"},
            {server: "singapore", url: "sg", state: "🔴 Offline"},
            {server: "southkorea", url: "kr", state: "🔴 Offline"}
        ];

        // 創建一個所有 fetch 請求的陣列
        const promises = server_info.map(async (serverItem) => {
            const url = `http://tw.ldeng.cc:10778/api/v1/query?query={instance="${serverItem.url}.ldeng.cc:9586"}`;
        
            try {
                // 發送請求
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${auth}`
                    }
                });
                const data = await response.json();
                const result = data.data.result;
                
                // 遍歷回應中的每個項目
                result.forEach(item => {
                    if (item.metric.__name__ === 'wireguard_device_info') {
                        const values = item.value;
                        if (values.includes('1')) {
                            // 如果包含 '1'，將伺服器的 state 改為 '🟢 Online'
                            serverItem.state = '🟢 Online';
                            // console.log(`${serverItem.server} state 更新為🟢 Online`);
                        }
                    }
                });
            } catch (error) {
                console.error('錯誤:', error);
            }
        });

        // 等待所有的 fetch 請求完成
        await Promise.all(promises);

        // 回覆伺服器狀態
        const embed = new EmbedBuilder()
                    .setColor('Navy')
                    .setTitle('節點狀態 - Node Status')
                    .addFields(
                        { name: 'Status', 
                        value:` 
                        ${server_info[0].state}\n
                        ${server_info[1].state}\n
                        ${server_info[2].state}\n
                        ${server_info[3].state}`,
                         inline: true },
                        { name: 'Address:Port', 
                        value: `
                        \`tw.ldeng.cc:61250\`\n
                        \`jp.ldeng.cc:61250\`\n
                        \`sg.ldeng.cc:61250\`\n
                        \`kr.ldeng.cc:61250\``, inline: true },
                        { name: 'Location', 
                        value: `
                        :flag_tw: TW\n
                        :flag_jp: JP\n
                        :flag_sg: SG\n
                        :flag_kr: KR`, inline: true },
                    )

        await interaction.reply({
            embeds: [embed],
            ephemeral: false,
        })
    }
});
// deletevpn指令
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const userid = interaction.user.id.toString();
    let serverData = readData();
    const optionuserid = interaction.options.get('用戶id')?.value;

    if (interaction.commandName === 'deletevpn') {

        if(optionuserid){
            if(userid === '385386899893911552' || userid === '401339547083866123'){
                delete serverData[optionuserid]
                await interaction.reply({
                    content:`已刪除VPN設定檔`,
                    ephemeral: false,
                });
            }else{
                await interaction.reply('沒有權限QQ')
            }
        } else{
            if(serverData[userid]){
                delete serverData[userid]
                await interaction.reply({
                    content:`已刪除VPN設定檔`,
                    ephemeral: false,
                });
            } else{
                await interaction.reply({
                    content:`沒東西給你刪了QQ`,
                    ephemeral: false,
                });
            }
        }

        writeData(serverData)
    }
});





client.once(Events.ClientReady, readyClient => {
	console.log(`✅ ${readyClient.user.tag} 啟動成功 ✅`);
});
client.login(configfile.token);
