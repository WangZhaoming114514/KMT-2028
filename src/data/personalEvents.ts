import { FactionId, RoundEvent } from '../types/game';

/**
 * 每位真實候選人專屬的 4 回合「個人風味事件」（於第 4、9、14、20 回合登場），
 * 讓 9 位候選人的競選體驗徹底分流，不再千篇一律！
 */
export const PERSONAL_ROUND_OVERRIDES: Record<FactionId, Record<number, RoundEvent>> = {
  // =========================================================
  // 1. 盧秀燕：媽媽市長 · 中火空氣 · 購物節 · 紅黑派整合
  // =========================================================
  lu: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 盧秀燕] 中火空氣清淨機 vs 經濟部大對決',
      title: '【盧媽專場】台中火力發電廠十機組全開！你直接抱一台空氣清淨機衝進總統府前！',
      situationBrief:
        '北部冬末空氣品質轉差，經濟部卻悄悄讓中火燃煤發電衝上滿載。中部媽媽群組大暴動，你決定親自拿著「谷關空氣瓶」與工業級空氣清淨機直球對決！',
      ccpNotice: '大陸網友笑稱「台中市長又要送谷關空氣了」，福建海警例行巡航。',
      japanNotice: '美日半導體商會高度關注台灣中南部電力與空污法規角力。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '供電穩定是全國共同責任，不要把台電基層同仁與中火當成地方選舉政治提款機！',
        body: '「台中市府屢次用地方自治條例卡關燃氣機組與電網調度，才是拖累能源轉型的元兇！」',
        likesLabel: '3.9萬愛心 · 中台灣媽媽暴怒洗版',
      },
      choices: [
        {
          id: 'lu_r4_air_purifier',
          toneLabel: '媽媽怒吼',
          label: '現場開箱「PM2.5 紫爆濾網」嗆爆賴清德：先把中部人的肺還來再講！',
          speechText:
            '「總統吹冷氣、中部人吸廢氣！今天這塊黑掉的濾網送給總統府當紀念，2028 我進總統府第一天就拆燃煤機組！」',
          hint: '中台灣媽媽與家庭票全面爆表，全國溫和吸票！',
          statDelta: { unity: 8, momentum: 12, funds: 5, ccpTension: 0, japanPosture: 3 },
          swing: { central: 2.2, north: 0.6, specificCounties: { 台中市: 2.8, 彰化縣: 1.9, 南投縣: 1.5 } },
          setFlags: ['lu_air_crusade'],
          pushReactions: [
            { type: '推', author: 'taichung_mom', text: '盧媽拿黑濾網真的太狠了，台中空品每天看就火大' },
          ],
          mediaReaction: '黑濾網畫面橫掃晚間新聞，中台灣婦女支持度衝上年度新高。',
        },
        {
          id: 'lu_r4_guguan_meme',
          toneLabel: '谷關空氣2.0',
          label: '推出限量「2028 勝選紀念版谷關空氣罐頭」，掃 QR Code 就能看中火排碳數據！',
          speechText:
            '「既然民進黨最喜歡笑谷關空氣，那我就做十萬瓶送給全台灣脆友聞聞看什麼叫乾淨的執政！」',
          hint: '梗圖流量狂炸、年輕脆友笑翻，但深藍嫌太像網紅賣貨。',
          statDelta: { unity: 2, momentum: 16, funds: 7, ccpTension: 0, japanPosture: 0 },
          swing: { central: 1.2, north: 0.8, tppShift: -0.9 },
          setFlags: ['meme_king'],
          pushReactions: [
            { type: '推', author: 'ptt_collector', text: '幹 谷關空氣出 2.0 數位版太有才了吧，哪裡領？' },
          ],
          mediaReaction: '網拍竟然出現「盧秀燕谷關空氣罐」黃牛炒價到五百元。',
        },
        {
          id: 'lu_r4_gentle_smile',
          toneLabel: '微笑太極',
          label: '面帶招牌慈祥微笑回一句「謝謝總統指教，市民健康最重要」，繼續跑攤剪綵',
          speechText:
            '「政治口水留給台北，我們台中繼續把市政做好、讓市民安居樂業！」',
          hint: '零失誤安全牌，黨內團結與企業好感穩定提升。',
          statDelta: { unity: 6, momentum: 3, funds: 6, ccpTension: -2, japanPosture: 4 },
          swing: { central: 1.0, north: 0.4 },
          pushReactions: [
            { type: '→', author: 'poli_watcher', text: '盧媽笑著打太極功力真的深不可測' },
          ],
          mediaReaction: '媒體評價盧秀燕「軟中帶鋼、不隨敵營起舞」。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 盧秀燕] 全國購物節抽總統府大禮包？',
      title: '【盧媽專場】政見竟喊「台中購物節擴大成全國發票抽豪宅」，脆友笑翻：買滷肉飯中總統？',
      situationBrief:
        '五月報稅痛苦期，你的幕僚不小心把台中購物節企劃原封不動放進總統政見簡報裡，綠白網軍立刻狂酸「只會發票抽獎治國」。',
      ccpNotice: '大陸電商直播主好奇研究台灣「發票對獎文化」。',
      japanNotice: '美日財經智庫對台灣「消費券與發票抽獎刺激內需」模式感到新奇。',
      rivalPost: {
        platform: 'PTT 政黑版',
        authorName: '黃國昌',
        authorRole: '民眾黨立院總召',
        authorHandle: 'KuoChang_TPP',
        portraitKey: 'huang',
        headline: '[討論] 用全國發票抽獎解決通膨與居住正義？真的太離譜了！',
        body: '「年輕人買不起房需要的是實坪制跟囤房稅，不是花十億稅金辦全台發票抽獎嘉年華！」',
        likesLabel: '推: 880 噓: 310 · 政黑戰成一團',
      },
      choices: [
        {
          id: 'lu_r9_tax_refund',
          toneLabel: '媽媽管家帳',
          label: '順水推舟宣布「全國減稅＋消費發票現金回饋」，把抽獎變成全民退稅！',
          speechText:
            '「媽媽持家就是精打細算！超徵稅收不該拿去養網軍，一半還稅於民、一半辦全民消費加碼！」',
          hint: '中南部攤商與家庭主夫主婦全力按讚！',
          statDelta: { unity: 5, momentum: 9, funds: 9, ccpTension: 0, japanPosture: 2 },
          swing: { central: 1.4, south: 0.9, north: 0.6, tppShift: -0.8 },
          pushReactions: [
            { type: '推', author: 'nightmarket_boss', text: '發票加碼真的會讓人多出門買東西，夜市推！' },
          ],
          mediaReaction: '零售業與餐飲公會罕見聯名讚聲。',
        },
        {
          id: 'lu_r9_housing_combo',
          toneLabel: '實坪反殺',
          label: '當場宣布「不抽豪宅改推全國萬戶青年婚育宅＋實坪制」，正面接球黃國昌！',
          speechText:
            '「感謝黃總召提醒！抽獎只是一時高興，我當選直接讓新婚青年住進公辦好宅！」',
          hint: '成功搶走大批白營年輕票，金主捐款略減。',
          statDelta: { unity: 3, momentum: 10, funds: -6, ccpTension: 0, japanPosture: 3 },
          swing: { north: 1.1, central: 1.2, tppShift: -1.4 },
          pushReactions: [
            { type: '推', author: 'young_couple', text: '這招轉彎轉得好漂亮，黃國昌沒話嘴了' },
          ],
          mediaReaction: '都會雙薪家庭給予高度肯定。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 盧秀燕] 梧棲港保釣媽媽補給艦出航！',
      title: '【盧媽專場】台中漁民赴釣魚台海域護漁遭水砲驅離，你親自到梧棲港煮大鍋麵慰勞！',
      situationBrief:
        '七月底中部漁船團前往釣魚台周邊傳統漁場作業時與他國公務船發生水砲對峙。你凌晨五點直奔台中梧棲漁港，捲起袖子親自端出熱騰騰海鮮麵，瞬間成為東亞新聞焦點。',
      ccpNotice: '北京緊盯台灣漁民與官方在釣魚台海域的實際行動。',
      japanNotice: '美日外交與安全圈密切評估藍營新共主在釣魚台議題的強硬程度。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '台日漁業協議得來不易，請政治人物切勿用民粹情緒破壞得來不易的區域穩定！',
        body: '「海巡署全力護漁的同時，也必須維持與美日友好鄰國的對話管道！」',
        likesLabel: '3.2萬愛心 · 釣魚台主權論戰',
      },
      choices: [
        {
          id: 'lu_r14_diaoyu_protect',
          toneLabel: '溫柔硬骨頭',
          label: '吃著漁民抓的小卷宣示：「釣魚台是中華民國固有領土，但護漁要靠談判桌上真本事！」',
          speechText:
            '「漁民要的是平安捕魚滿載而歸，不是網軍嘴砲！我主政後一定重談對等漁權，寸步不讓也絕不挑起無謂衝突！」',
          hint: '兼顧主權尊嚴與美日溝通管道，漁會與中產同時買單！',
          statDelta: { unity: 7, momentum: 9, funds: 6, ccpTension: -2, japanPosture: 6 },
          swing: { central: 1.3, east: 1.2, north: 0.7, specificCounties: { 宜蘭縣: 1.5, 台中市: 1.4 } },
          setFlags: ['diaoyu_patrol'],
          pushReactions: [
            { type: '推', author: 'suao_fisherman', text: '講得有骨氣又不會亂開戰，漁民給讚' },
          ],
          mediaReaction: '梧棲港端海鮮麵照片登上美日與港台頭版。',
        },
        {
          id: 'lu_r14_hard_patrol',
          toneLabel: '強硬護漁',
          label: '怒吼「海巡艦艇全部給我升旗開過去！誰敢噴台灣漁船就加倍噴回去！」',
          speechText:
            '「中華民國漁民在哪裡，國旗與海巡艦就在哪裡！軟骨頭政府做不到的，媽媽市長替你們出這口氣！」',
          hint: '本島深藍與蘇澳漁民沸騰，但美日態度急凍！',
          statDelta: { unity: 9, momentum: 14, funds: 4, ccpTension: 6, japanPosture: -14 },
          swing: { east: 1.8, islands: 1.4, north: -0.4, specificCounties: { 宜蘭縣: 2.2 } },
          setFlags: ['diaoyu_patrol'],
          pushReactions: [
            { type: '推', author: 'deep_blue_roc', text: '太霸氣了！！這才是正統中華民國總統格局' },
          ],
          mediaReaction: '東京與華府對你的強硬發言表達高度關切。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 盧秀燕] 紅黑派暗黑慶生宴與高調造勢',
      title: '【盧媽專場】台中紅黑派＋雲林張家千桌流水席大動員！綠營批「地方黑金復辟」',
      situationBrief:
        '十月底選戰白熱化，中台灣傳統地方派系替你擺開五百桌流水席造勢，綠營拍下大老同框畫面狂洗「地方黑金大集合」。',
      ccpNotice: '大陸台辦低調觀察中南部農會組織動員力。',
      japanNotice: '美日駐台觀察員注意到台灣地方樁腳文化在現代選戰依然極具威力。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '台灣不需要走回派系分贓與地方山頭把持的老路！年輕人看得清清楚楚！',
        body: '「站在五百桌流水席中央，真的能代表台灣未來的清廉政治嗎？」',
        likesLabel: '4.4萬愛心 · 派系攻防',
      },
      choices: [
        {
          id: 'lu_r20_grassroots_pride',
          toneLabel: '直球擁抱基層',
          label: '拿麥克風大喊：「基層農漁會與鄉親不是黑金！看不起鄉下人的才是台北權貴！」',
          speechText:
            '「每一桌都是鄉親自己集資辦的！民進黨在台北吹冷氣吃法國菜，卻把中南部基層全部抹黑成黑金！」',
          hint: '中南部基本盤與糧草爆表，北部都會票微幅觀望。',
          statDelta: { unity: 12, momentum: 8, funds: 15, ccpTension: 0, japanPosture: 0 },
          swing: { central: 2.0, south: 1.3, north: -0.5, specificCounties: { 彰化縣: 2.4, 雲林縣: 2.5 } },
          pushReactions: [
            { type: '推', author: 'changhua_farmer', text: '講出我們的心聲！一天到晚被台北網軍抹黑真的很賭爛' },
          ],
          mediaReaction: '中台灣五百桌變成全國基層反撲高房價高冷傲的象徵。',
        },
        {
          id: 'lu_r20_clean_pledge',
          toneLabel: '排黑條款',
          label: '現場宣布「全黨簽署反貪腐廉政公約」，只吃素炒米粉不收大額現金！',
          speechText:
            '「基層熱血我收下，政治紅線我守住！我們要用最清廉的媽媽精神進軍重慶南路！」',
          hint: '北部都會選民放下戒心，中台灣略有微詞但仍力挺。',
          statDelta: { unity: 5, momentum: 7, funds: 4, ccpTension: 0, japanPosture: 4 },
          swing: { north: 1.1, central: 0.9 },
          pushReactions: [
            { type: '推', author: 'taipei_middle', text: '敢在流水席上要求簽廉政公約算很有guts' },
          ],
          mediaReaction: '成功拆彈綠營抹黑攻勢，北部民調穩定領先。',
        },
      ],
    },
  },

  // =========================================================
  // 2. 蔣萬安：台北帥哥 · 蔣家血統DNA · 大巨蛋威尼斯 · 雙城論壇
  // =========================================================
  chiang: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 蔣萬安] 蔣家血統與慈湖直播開箱族譜之亂',
      title: '【萬安專場】綠營側翼狂洗「姓章還是姓蔣」，要求你去慈湖開箱 DNA 族譜直播！',
      situationBrief:
        '二二八連假，脆上突發狂潮：十萬則留言要求你公開蔣家血統 DNA 檢驗，深藍老榮民氣到拿拐杖敲電視，年輕人當成八點檔吃瓜看戲。',
      ccpNotice: '大陸浙江奉化網友也跑來吃瓜留言：「奉化溪口老家隨時歡迎回來認祖！」',
      japanNotice: '美日外媒好奇報導台灣 2028 大選竟然還在討論百年家族姓氏問題。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '民主時代不靠血統與姓氏光環執政，台灣人民看的是對這塊土地的忠誠！',
        body: '「一直消費歷史姓氏紅利卻不肯徹底檢討威權遺緒，年輕世代不會買單！」',
        likesLabel: '5.5萬愛心 · 族譜八點檔大爆發',
      },
      choices: [
        {
          id: 'chiang_r4_self_roast',
          toneLabel: '帥哥破防反殺',
          label: '在脆上發自己健身帥照反問：「姓蔣姓章重要嗎？總比賴總統執政跳電又吃萊豬好吧！」',
          speechText:
            '「2027 年了執政黨還在查別人家祖譜？我就是正港台北長大的蔣萬安！有本事比市政政績，別整天當徵信社！」',
          hint: '年輕女性與都會票狂飆，深藍略怪沒多背兩句蔣公遺囑。',
          statDelta: { unity: 4, momentum: 16, funds: 6, ccpTension: 0, japanPosture: 5 },
          swing: { north: 1.8, central: 0.7, dppShift: -0.9, specificCounties: { 台北市: 2.2 } },
          pushReactions: [
            { type: '推', author: 'tpe_office_lady', text: '萬安回得好帥！！2027還在查別人祖譜真的有病' },
          ],
          mediaReaction: '健身照配反殺金句狂吸十五萬愛心，成功把歷史批鬥變成偶像魅力秀。',
        },
        {
          id: 'chiang_r4_three_principles',
          toneLabel: '正統蔣家軍',
          label: '穿上中山裝赴國父紀念館高呼：「我以中華民國與三民主義為榮！國民黨萬歲！」',
          speechText:
            '「蔣經國先生建設台灣十大建設與護國神山群！我們繼承的是這份愛民遺產！三民主義萬歲！」',
          hint: '深藍軍公教淚流滿面，團結度暴漲，年輕票略微縮水。',
          statDelta: { unity: 15, momentum: 8, funds: 11, ccpTension: 2, japanPosture: 0 },
          swing: { north: 0.9, east: 1.7, islands: 1.8, south: -0.5 },
          setFlags: ['three_principles_zealot'],
          pushReactions: [
            { type: '推', author: 'veteran_1949', text: '看到經國先生精神重現，老兵我這票投定了！' },
          ],
          mediaReaction: '深藍眷村動員率瞬間回春，黃復興老兵全體集結。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 蔣萬安] 台北大巨蛋又變威尼斯＋輝達顯卡催生計畫！',
      title: '【萬安專場】大巨蛋看台再度噴水變貢多拉水道，你卻端出「生三胎送輝達 AI 顯卡＋千萬購屋券」？',
      situationBrief:
        '五月梅雨季大巨蛋再度上演室內水舞秀，網友嘲諷「台北威尼斯市長」。你的團隊趁勢抛出超狂「三胎救國大禮包」，引爆少子化大戰。',
      ccpNotice: '微博熱搜驚呼「台北市長要把大巨蛋改成水上樂園」。',
      japanNotice: '日本少子化對策擔當大臣辦公室要求翻譯這份「送顯卡催生方案」。',
      rivalPost: {
        platform: 'PTT 八卦版',
        authorName: '柯文哲',
        authorRole: '民眾黨創黨主席',
        authorHandle: 'KP_Taiwan',
        portraitKey: 'ko',
        headline: '[新聞] 大巨蛋漏水修兩年修不好，現在喊生三胎送顯卡是哪門子財政紀律？',
        body: '「少子化問題要靠公托跟降低房價，不是靠撒幣跟威尼斯水舞秀！」',
        likesLabel: '推: 1200 · 台北政壇父子局對決',
      },
      choices: [
        {
          id: 'chiang_r9_venice_gondola',
          toneLabel: '威尼斯大帝國',
          label: '超狂接梗！宣布大巨蛋乾脆加裝「台北威尼斯貢多拉觀景台」順便收門票還債！',
          speechText:
            '「既然全台灣都想看台北威尼斯，我就把危機變商機！一張船票五百元拿去補貼台北公托與育兒津貼！」',
          hint: '荒謬度破表！極易觸發「蔣萬安大巨蛋威尼斯帝國」特殊隱藏結局！',
          statDelta: { unity: -3, momentum: 20, funds: 5, ccpTension: 0, japanPosture: 2 },
          swing: { north: 1.0, central: 0.4, tppShift: -0.7 },
          setFlags: ['venice_dome_meme', 'love_power_meme'],
          pushReactions: [
            { type: '推', author: 'dome_memer', text: '幹 市長真的承認台北帝國威尼斯化了，這局太神啦' },
          ],
          mediaReaction: '國際建築雜誌竟然刊出這則超現實新聞，大巨蛋成為全台最大迷因地標。',
        },
        {
          id: 'chiang_r9_gpu_babies',
          toneLabel: '科技催生王',
          label: '嚴肅承諾「全國六歲以下公托全免＋雙北萬戶婚育社宅＋輝達研發中心留台」！',
          speechText:
            '「別只會笑！育兒爸媽要的是真金白銀的支持跟世界級科技就業機會！」',
          hint: '雙北與竹科工程師爸爸大力買單！',
          statDelta: { unity: 7, momentum: 9, funds: 4, ccpTension: 0, japanPosture: 6 },
          swing: { north: 1.8, specificCounties: { 台北市: 2.3, 新北市: 1.7, 新竹市: 1.6 } },
          pushReactions: [
            { type: '推', author: 'neihu_dad', text: '公托全免真的會讓人敢生第二胎，給推' },
          ],
          mediaReaction: '台北與新竹青年家庭支持度穩定領先。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 蔣萬安] 雙城論壇硬碰硬：蔣公遺囑反殺統戰！',
      title: '【萬安專場】上海代表在雙城論壇現場逼問「兩岸一家親」，全網盯著你敢不敢反殺！',
      situationBrief:
        '夏季雙城論壇在台北登場，對岸副市長突然脫稿要求你重申「兩岸一家親」，民進黨議員坐在台下準備錄影剪輯成賣台大作。',
      ccpNotice: '上海與北京台辦代表緊盯麥克風，現場氣氛降到冰點。',
      japanNotice: '美日駐台官員全程鎖定直播，觀察蔣家第四代如何定義兩岸底線。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '台北市長即將代表藍營問鼎大位，今日一字一句都代表台灣主權底線！',
        body: '「兩岸交流應該對等尊嚴，不應在對岸壓力下自我矮化！」',
        likesLabel: '4.1萬愛心 · 雙城論壇全程直播',
      },
      choices: [
        {
          id: 'chiang_r14_anti_ccp_flex',
          toneLabel: '少主反殺秀',
          label: '當著上海代表面前冷靜回應：「共機別再飛過來、先認識中華民國憲法與自由民主再談！」',
          speechText:
            '「雙城論壇講的是城市治理，不是政治表態！唯有中華民國存在、台灣民主自由安全，兩岸才有真正的和平交流！」',
          hint: '本島與美日全場沸騰叫好！台北票倉暴漲，但中共壓力急升！',
          statDelta: { unity: 5, momentum: 16, funds: 5, ccpTension: 14, japanPosture: 15 },
          swing: { north: 2.0, central: 1.0, south: 0.9, islands: -1.2, dppShift: -1.1 },
          setFlags: ['anti_ccp_hawk'],
          pushReactions: [
            { type: '推', author: 'taipei_youth', text: '哇靠！！這波蔣萬安居然在對岸面前講得這麼硬，綠營議員直接詞窮' },
          ],
          mediaReaction: '外媒稱讚蔣萬安成功建立「捍衛台灣自由的藍營新世代」形象。',
        },
        {
          id: 'chiang_r14_city_only',
          toneLabel: '市政安全牌',
          label: '只談「台北捷運、垃圾減量與台北馬拉松交流」，微笑把政治題滑過去',
          speechText:
            '「台北與上海最重要的是市民生活與環保經驗分享，少一點口號多一點交流！」',
          hint: '穩住兩岸溫度，但本土脆友嫌「太閃躲」。',
          statDelta: { unity: 4, momentum: -2, funds: 6, ccpTension: -6, japanPosture: 2 },
          swing: { north: 0.4, islands: 0.8 },
          pushReactions: [
            { type: '→', author: 'media_watch', text: '四平八穩，沒失分但也沒搶到頭條' },
          ],
          mediaReaction: '論壇平和落幕，綠營未能抓到明確把柄。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 蔣萬安] 蔣公雕像與台北市政終極投票',
      title: '【萬安專場】台北市突爆「移除銅像 vs 改建自由廣場文創園」公投，年輕人要你站隊！',
      situationBrief:
        '距離投票剩兩個月，中正紀念堂園區轉型公投連署達標！你的一句話將決定深藍眷村與台北潮青誰會倒戈。',
      ccpNotice: '大陸網路冷眼觀看台北內部意識形態內戰。',
      japanNotice: '美日觀察家關注少壯派如何平衡歷史包袱與現代化形象。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '威權象徵應該走入歷史，把空間還給台灣人民與自由創作！',
        body: '「蔣萬安候選人敢不敢面對自己祖先留下的轉型正義問題？」',
        likesLabel: '4.6萬愛心 · 首都意識形態決戰',
      },
      choices: [
        {
          id: 'chiang_r20_design_park',
          toneLabel: '美學解套',
          label: '提出「歷史保存＋國際設計音樂園區共存」，讓滑板少年跟老榮民共享廣場！',
          speechText:
            '「歷史不需要靠拆除來證明進步！讓自由廣場變成台灣設計與民主對話的世界級地標！」',
          hint: '都會年輕與中間選民高度肯定，台北再拉開領先！',
          statDelta: { unity: 4, momentum: 9, funds: 6, ccpTension: 0, japanPosture: 5 },
          swing: { north: 1.5, specificCounties: { 台北市: 2.0 } },
          pushReactions: [
            { type: '推', author: 'hipster_tpe', text: '把銅像旁邊變成音樂祭跟滑板場這招很台北，推' },
          ],
          mediaReaction: '設計圈與建築學者普遍給予好評。',
        },
        {
          id: 'chiang_r20_guard_statue',
          toneLabel: '寸步不讓',
          label: '霸氣護衛：「建設台灣的功績不容抹滅，誰敢動銅像先問台北市民！」',
          speechText:
            '「沒有當年的保衛台灣與經濟起飛，民進黨今天能在台北開選舉記者會嗎？」',
          hint: '深藍極度忠誠度爆表，但部分中間青年轉往白營。',
          statDelta: { unity: 12, momentum: 7, funds: 9, ccpTension: 0, japanPosture: -2 },
          swing: { east: 1.3, north: 0.4, tppShift: 0.8 },
          pushReactions: [
            { type: '推', author: 'blue_guard', text: '就是不能再被文化台獨一步步切香腸！' },
          ],
          mediaReaction: '眷村鐵票全體歸隊。',
        },
      ],
    },
  },

  // =========================================================
  // 3. 韓國瑜：立院金句王 · 爬樹聞登革熱 · 愛情摩天輪 · 韓流夜襲
  // =========================================================
  han: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 韓國瑜] 愛情摩天輪 2.0 直通重慶南路！',
      title: '【韓總專場】突襲喊出「總統府結合凱道愛情摩天輪＋台灣成為塞子不是棋子」，全網炸鍋！',
      situationBrief:
        '二二八連假造勢場，你甩開幕僚準備的冷冰冰讀稿機，現場金句連發：「台灣不當大國棋子，也不當只能被塞進去的塞子，我們要當澡盆裡的快樂鴨子！」',
      ccpNotice: '大陸網友狂刷「韓總這段比相聲還好笑」，一時忘了批評。',
      japanNotice: '美日外交翻譯官花了三小時研究「棋子、塞子與澡盆鴨子」的英文與日文翻譯，最後放棄。',
      rivalPost: {
        platform: 'PTT 八卦版',
        authorName: '賴清德',
        authorRole: '民進黨社群團隊',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '[新聞] 國家安全不是在夜總會講笑話！請韓國瑜候選人正視國際現實！',
        body: '「台灣不需要愛情摩天輪，需要的是穩健的國防外交與半導體競爭力！」',
        likesLabel: '推: 450 噓: 980 · 韓流金句大亂鬥',
      },
      choices: [
        {
          id: 'han_r4_golden_quotes',
          toneLabel: '韓氏幽默核彈',
          label: '回嗆賴總統：「治大國如烹小鮮，治民進黨要靠大聲笑！莫忘世上苦人多！」',
          speechText:
            '「整天板著臉抗中保台有比較快樂嗎？庶民要的是發大財、吃得飽、笑得出來！跟著韓總喊：台灣安全、人民有錢！」',
          hint: '韓粉大軍全面喚醒！中南部與庶民聲量狂飆！',
          statDelta: { unity: 8, momentum: 18, funds: 8, ccpTension: -3, japanPosture: -2 },
          swing: { south: 1.6, central: 1.2, east: 1.4, specificCounties: { 高雄市: 2.2 } },
          setFlags: ['han_wave_revived'],
          pushReactions: [
            { type: '推', author: 'han_army', text: '幹 韓總一開口就全場沸騰，綠營唸稿唸到快睡著' },
          ],
          mediaReaction: '「澡盆鴨子」成為年度第一鬼畜神曲，夜市攤販支持率暴衝。',
        },
        {
          id: 'han_r4_speaker_dignity',
          toneLabel: '院長格局',
          label: '收斂玩笑改走「立法院長國會外交沉穩路線」，用成語跟對聯反擊！',
          speechText:
            '「政治是良心事業！我們在國會接見四十國訪賓，比誰都懂中華民國的國際分寸！」',
          hint: '美日與知識藍刮目相看，但韓粉嫌「不夠辣」。',
          statDelta: { unity: 6, momentum: 4, funds: 7, ccpTension: 0, japanPosture: 7 },
          swing: { north: 1.0, central: 0.7 },
          pushReactions: [
            { type: '推', author: 'blue_scholar', text: '當過院長真的氣質沉穩很多，推' },
          ],
          mediaReaction: '中間選民驚訝韓國瑜竟能穩重收放自如。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 韓國瑜] 爬樹聞樹洞＋夜市礦泉水直播！',
      title: '【韓總專場】南台灣初夏爆發登革熱！你親赴台南再度「單手爬上芒果樹聞樹洞」驚呆全場！',
      situationBrief:
        '台南出現首波本土登革熱病例，你赴南部視察防疫時突然鞋子一脫爬上兩層樓高芒果樹檢查樹洞積水，脆友集體回憶湧上心頭！',
      ccpNotice: '對岸網民驚呼「台灣院長身手比武術指導還好」。',
      japanNotice: '美日媒體以「台灣庶民政治奇觀」大篇幅轉播爬樹畫面。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '登革熱防治需要中央地方科學投藥與清消，不需要攀爬行道樹製造危險示範！',
        body: '「請候選人愛惜身體也愛惜台南市容，防疫交給專業衛福團隊！」',
        likesLabel: '3.6萬愛心 · 爬樹重播百萬次',
      },
      choices: [
        {
          id: 'han_r9_tree_climb',
          toneLabel: '真男人身手',
          label: '從樹上跳下來拿一瓶礦泉水乾杯：「上面真的有蚊子！賴清德有本事也爬上來聞看看！」',
          speechText:
            '「坐在冷氣房看報表抓得到蚊子嗎？我爬樹是要提醒全台灣，上面積水比下面還深！這瓶礦泉水敬基層清潔隊員！」',
          hint: '流量大爆炸！台南高雄基層笑到肚子痛、礦泉水銷量翻倍！',
          statDelta: { unity: 5, momentum: 19, funds: 4, ccpTension: 0, japanPosture: 0 },
          swing: { south: 1.9, central: 0.9, specificCounties: { 台南市: 2.0, 高雄市: 2.2 } },
          setFlags: ['meme_king'],
          pushReactions: [
            { type: '推', author: 'tainan_uncle', text: '幹 韓總69歲還能直接爬上芒果樹真的猛，比官員坐黑頭車強' },
          ],
          mediaReaction: '便利商店十元礦泉水被韓粉搶購一空。',
        },
        {
          id: 'han_r9_water_pump',
          toneLabel: '基層實幹',
          label: '不爬樹了，直接陪台南里長清溝噴藥兩小時，滿身大汗不發一語！',
          speechText:
            '「多做事少噴口水，清完這條水溝比開十場記者會有用！」',
          hint: '南部里長與中間選民意外給予極高評價！',
          statDelta: { unity: 7, momentum: 8, funds: 5, ccpTension: 0, japanPosture: 2 },
          swing: { south: 1.7, central: 0.8 },
          pushReactions: [
            { type: '推', author: 'khh_volunteer', text: '真的下來幫忙清溝滿身汗，沒得黑了' },
          ],
          mediaReaction: '南台灣破冰效果顯著。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 韓國瑜] 凱道十萬支國旗「一碗滷肉飯」決戰！',
      title: '【韓總專場】盛夏發起「一瓶礦泉水、一碗滷肉飯」凱道大集結，全場齊唱《夜襲》震撼台北！',
      situationBrief:
        '你動員庶民韓粉在凱道自發搭舞台唱軍歌《夜襲》，綠營大喊「軍國主義復辟」，現場卻賣出兩萬碗庶民滷肉飯與國旗香腸。',
      ccpNotice: '大陸網路看傻：「這到底是競選造勢還是台灣最大夜市？」',
      japanNotice: '美日駐台人員在現場買了兩根大腸包小腸邊吃邊寫電報。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '民主選舉不該動員威權軍歌製造對立！台灣人要的是和平理性！',
        body: '「半夜在總統府前高唱《夜襲》，到底想把台灣帶回哪個年代？」',
        likesLabel: '4.1萬愛心 · 夜襲大合唱破表',
      },
      choices: [
        {
          id: 'han_r14_night_raid',
          toneLabel: '夜襲穿雲箭',
          label: '拿大聲公領唱：「我們夜襲的是高房價與貪腐！一支穿雲箭、千軍萬馬來相見！」',
          speechText:
            '「一支穿雲箭、千軍萬馬來相見！我們夜襲的不是人民，是貪官污吏跟雙標政客！國民黨萬歲！」',
          hint: '藍營凝聚力與糧草衝破天花板，中南部庶民淚流滿面！',
          statDelta: { unity: 15, momentum: 16, funds: 12, ccpTension: 2, japanPosture: -3 },
          swing: { central: 1.5, south: 1.3, east: 1.8, islands: 1.5 },
          pushReactions: [
            { type: '推', author: 'han_flag', text: '一支穿雲箭！！聽到雞皮疙瘩都起來了' },
          ],
          mediaReaction: '凱道十萬支國旗海成為年度最震撼空拍畫面。',
        },
        {
          id: 'han_r14_love_taiwan_song',
          toneLabel: '溫情老歌',
          label: '臨時把軍歌改成全場合唱《愛拚才會贏》＋《中華民國頌》，邀請跨黨派攤商上台！',
          speechText:
            '「做生意不分藍綠！只要讓大家賺得到錢，明天我們一起拚經濟！」',
          hint: '吸收中間攤商與白營基層好感！',
          statDelta: { unity: 7, momentum: 10, funds: 8, ccpTension: -2, japanPosture: 4 },
          swing: { north: 0.7, central: 1.3, south: 1.3, tppShift: -0.9 },
          pushReactions: [
            { type: '推', author: 'nightmarket_bro', text: '唱愛拚才會贏就對了啦，接地氣！' },
          ],
          mediaReaction: '夜市圈一致好評，氣氛熱烈又祥和。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 韓國瑜] 雲林農會＋鳳梨外銷奇蹟秀',
      title: '【韓總專場】外銷訂單突傳卡關！韓國瑜親自推「台灣農產黃金走廊」直衝南台灣果園！',
      situationBrief:
        '秋收季節中南部鳳梨、文旦與石斑魚產地價格大跌，農民急得跳腳。你捲起褲管走進雲林與屏東果園現場拍賣。',
      ccpNotice: '大陸方面拋出「只要縣市長認可九二共識即可恢復部份農產進口」條件。',
      japanNotice: '日本超市聯盟宣布加碼採購台灣高雄與屏東鳳梨，展現美日友台誠意。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '政府已全力開拓美日與新加坡高端農產市場，絕不讓台灣農民被單一市場卡脖子！',
        body: '「請在野黨不要再把農民當成九二共識的統戰人質！」',
        likesLabel: '2.9萬愛心 · 農產大戰',
      },
      choices: [
        {
          id: 'han_r20_global_auction',
          toneLabel: '美日東南亞全賣',
          label: '同時把鳳梨賣給東京、新加坡、也賣給願意公平採購的客戶：「農民賺錢最重要！」',
          speechText:
            '「東西賣得出去、人進得來，高雄台南屏東發大財！美日訂單我們搶，兩岸正常貿易我們也要！」',
          hint: '農業縣爆棚同時獲得美日商界掌聲！',
          statDelta: { unity: 8, momentum: 11, funds: 10, ccpTension: -4, japanPosture: 9 },
          swing: { south: 2.0, central: 1.6, specificCounties: { 雲林縣: 2.6, 屏東縣: 2.0, 高雄市: 1.8 } },
          pushReactions: [
            { type: '推', author: 'yunlin_farmer', text: '農民真的只想要訂單而已，管他誰買只要付錢都讚' },
          ],
          mediaReaction: '單場直播賣出八千箱鳳梨，農民笑開懷。',
        },
        {
          id: 'han_r20_92_orders',
          toneLabel: '兩岸大單',
          label: '直接對北京喊話：「立刻取消所有水果禁令，否則誰信你兩岸一家親！」',
          speechText:
            '「做生意要講信用！不要嘴上說親、手上卡台灣鳳梨！有誠意先把訂單開出來！」',
          hint: '意外贏得本島中間派掌聲，北京尷尬回應！',
          statDelta: { unity: 5, momentum: 12, funds: 4, ccpTension: 6, japanPosture: 4 },
          swing: { south: 1.3, central: 1.2, north: 0.7 },
          pushReactions: [
            { type: '推', author: 'pingtung_farm', text: '敢直接叫北京把禁令撤掉算很有膽識！' },
          ],
          mediaReaction: '台灣農民罕見力讚藍營候選人對北京硬起來。',
        },
      ],
    },
  },

  // =========================================================
  // 4. 趙少康：戰鬥藍教主 · 少康戰情室 · 益生菌廣告 · 白板之王
  // =========================================================
  jaw: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 趙少康] 《少康戰情室》現場綁架公辦政見會！',
      title: '【少康專場】公辦政見發表會上你直接拿出搶答鈴與小白板，把現場變成《戰情室》還插播廣告！',
      situationBrief:
        '首次電視政見會上，你嫌中選會規則太無聊，自備節目倒數鈴鐺與白板筆直接指揮全場節奏，講到一半順便推薦「長輩顧腸胃益生菌」。',
      ccpNotice: '大陸觀眾驚訝「台灣政見會居然自帶主持人跟廣告插播」。',
      japanNotice: '美日駐台記者看呆，形容趙少康是「台北的貝魯斯科尼」。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '這是莊嚴的國家總統政見發表會，不是某人的深夜政論攝影棚！',
        body: '「請趙候選人尊重民主程序，不要把國家大政當成電視台收視率工具！」',
        likesLabel: '3.7萬愛心 · 攝影棚大戰',
      },
      choices: [
        {
          id: 'jaw_r4_studio_takeover',
          toneLabel: '戰情室模式全開',
          label: '按響搶答鈴大吼：「來，現場請賴總統自己算一下台電虧損！不答就是心虛！」',
          speechText:
            '「我當了三十年主持人，比你懂什麼叫直球對決！現在進廣告三十秒，回來請總統回答為什麼電價漲！」',
          hint: '戰鬥藍爽度滿點、收視率破表，但年輕選民覺得太像電視購物。',
          statDelta: { unity: 7, momentum: 17, funds: 10, ccpTension: 2, japanPosture: 0 },
          swing: { north: 1.5, central: 0.9, east: 1.2, specificCounties: { 台北市: 1.9 } },
          pushReactions: [
            { type: '推', author: 'tv_addict', text: '幹 現場按搶答鈴逼問總統太有節目效果了哈哈哈哈' },
          ],
          mediaReaction: '政見會收視率創二十年新高，中老年收視群全力歸隊。',
        },
        {
          id: 'jaw_r4_sharp_policy',
          toneLabel: '金童論述',
          label: '收起玩笑改用三分鐘流利英文＋經濟數據拆穿執政黨能源與外交盲點！',
          speechText:
            '「政治金童不是浪得虛名！用真實數據比較 1990 與 2027 台灣產業危機，這才是國家領導人高度！」',
          hint: '科技業與美日外交圈對趙少康專業底氣刮目相看！',
          statDelta: { unity: 6, momentum: 8, funds: 9, ccpTension: 0, japanPosture: 8 },
          swing: { north: 1.7, central: 0.8, specificCounties: { 新竹市: 1.8, 台北市: 1.7 } },
          pushReactions: [
            { type: '推', author: 'finance_pro', text: '少康一認真講經濟數據還是超強，比只會噴口水好太多' },
          ],
          mediaReaction: '商界與都會白領紛紛點讚。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 趙少康] 戰鬥藍黨內清君側：怒轟不站台立委！',
      title: '【少康專場】戰鬥藍名單大點名！你直播痛批三位藍營縣市長「只顧明哲保身、不敢罵民進黨！」',
      situationBrief:
        '五月造勢協調會幾位本土派首長缺席，你直接在《戰情室》節目上點名批判「龜縮」，引爆黨內路線內戰警報。',
      ccpNotice: '北京觀察員筆記：「戰鬥藍內鬥火力比打民進黨還猛」。',
      japanNotice: '美日觀察家擔憂國民黨保守鷹派與地方本土派再度裂解。',
      rivalPost: {
        platform: 'PTT 政黑版',
        authorName: '黃國昌',
        authorRole: '民眾黨吃瓜看戲中',
        authorHandle: 'KuoChang_TPP',
        portraitKey: 'huang',
        headline: '[討論] 國民黨自己先開《少康批鬥室》了，在野整合還要不要選？',
        body: '「每天先批鬥自己同志，到底誰是敵人誰是朋友？」',
        likesLabel: '推: 爆 · 政黑吃瓜大會',
      },
      choices: [
        {
          id: 'jaw_r9_double_down',
          toneLabel: '戰鬥到底',
          label: '加碼怒轟：「不敢戰就讓位！沒有戰鬥藍，國民黨早被綠營吃乾抹淨！」',
          speechText:
            '「溫良恭儉讓已經讓國民黨輸了三次！誰再躲在地方裝乖寶寶，我就帶戰鬥藍去他選區開講！」',
          hint: '深藍鷹派流量狂飆，但黨內團結大幅下跌（小心換柱或內爆）！',
          statDelta: { unity: -12, momentum: 15, funds: 5, ccpTension: 2, japanPosture: -3 },
          swing: { north: 0.8, east: 1.4, central: -0.9 },
          pushReactions: [
            { type: '推', author: 'combat_blue', text: '少康講得沒錯，黨內太多投機份子該罵！' },
            { type: '噓', author: 'local_blue', text: '還沒選上就先砍自己人，真的嫌票太多' },
          ],
          mediaReaction: '戰鬥藍與本土派進入冷戰期。',
        },
        {
          id: 'jaw_r9_wine_peace',
          toneLabel: '大和解咖啡',
          label: '隔天親自提一箱高粱酒去地方縣市長官邸「喝一杯全數和解，砲口一致對賴！」',
          speechText:
            '「我趙少康性子急、講話衝，但目標都是下架民進黨！這杯高粱敬地方兄弟！」',
          hint: '完美拆彈！團結度立刻回血且展現大哥氣度！',
          statDelta: { unity: 12, momentum: 7, funds: 7, ccpTension: 0, japanPosture: 3 },
          swing: { central: 1.2, north: 0.8, east: 0.9 },
          pushReactions: [
            { type: '推', author: 'taichung_bro', text: '能屈能伸直接拿高粱去賠不是，這招收服人心' },
          ],
          mediaReaction: '藍營首長全數回防站台，媒體讚「大哥風範」。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 趙少康] 硬槓外媒記者：釣魚台與美日安保大辯論！',
      title: '【少康專場】國際記者會上美日記者連環追問釣魚台與兵役延長，你當場開啟英文辯論模式！',
      situationBrief:
        '七月外媒聯訪，東京與華府駐台記者直接質問你「為何反對無條件提高軍購，以及對釣魚台的立場」，你眉頭一皺直接跟記者辯論起來！',
      ccpNotice: '大陸媒體截圖狂讚「趙少康舌戰群儒」。',
      japanNotice: '美日駐台使館高層全程緊盯這場火藥味十足的英文辯論。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '國際外交需要建立信任而非在記者會上與盟友記者吵架！',
        body: '「台灣的安全離不開美日同盟合作，在野黨不應把對外關係當成政論節目耍嘴皮！」',
        likesLabel: '3.5萬愛心 · 外交風格大對決',
      },
      choices: [
        {
          id: 'jaw_r14_usjp_debate',
          toneLabel: '強硬主權派',
          label: '用流利英文回擊：「我們要的是實戰裝備不是過期武器庫存！釣魚台漁權更一步不退！」',
          speechText:
            '「台灣自己付錢買武器，憑什麼不能要求準時交貨？釣魚台海域更是台灣漁民世世代代的漁場！」',
          hint: '本島與網路戰力大漲，但美日官方臉色略沉！',
          statDelta: { unity: 8, momentum: 14, funds: 5, ccpTension: 0, japanPosture: -9 },
          swing: { north: 1.0, central: 0.8, east: 1.3 },
          setFlags: ['diaoyu_patrol'],
          pushReactions: [
            { type: '推', author: 'taiwan_taxpayer', text: '問為什麼付錢買武器不交貨這題太犀利了，老美都啞口無言' },
          ],
          mediaReaction: '這段英文反問影片在脆上瘋傳三十萬次。',
        },
        {
          id: 'jaw_r14_alliance_pro',
          toneLabel: '務實盟友牌',
          label: '改口展現誠意：「我們全力強化不對稱戰力與美日情資互通，釣魚台採共同漁業和平開發！」',
          speechText:
            '「我比任何人都了解華府運作！國民黨執政將讓台美日軍事與半導體互信更緊密！」',
          hint: '美日態度暴漲 +15！北部科技與知識藍放心投藍！',
          statDelta: { unity: 3, momentum: 7, funds: 8, ccpTension: 8, japanPosture: 15 },
          swing: { north: 1.5, central: 0.7, specificCounties: { 新竹市: 1.6, 台北市: 1.6 } },
          setFlags: ['pro_japan_security'],
          pushReactions: [
            { type: '推', author: 'us_tw_watch', text: '這樣表態才像準備接班執政的總統' },
          ],
          mediaReaction: '華府智庫評價趙少康「語鋒犀利但戰略方向清晰」。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 趙少康] 封關前夕：自辦百萬人線上政論大審判',
      title: '【少康專場】買下黃金時段連播七夜《民進黨八大罪狀總清算》，收視碾壓八點檔！',
      situationBrief:
        '十月底選戰倒數，你動用全部媒體資源打造超級電視特輯，逐日公開揭露光電、雞蛋、疫苗與媒體標案帳目。',
      ccpNotice: '對岸涉台頻道全面關注台灣黃金時段輿論戰。',
      japanNotice: '美日駐台新聞組加班翻譯這系列強打節目。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '民進黨總部反擊',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '利用龐大媒體資產進行七天抹黑轟炸，這就是台灣人想要的媒體壟斷嗎？',
        body: '「請大家不要被特定電視台剪輯帶風向，事實經得起檢驗！」',
        likesLabel: '4.2萬愛心 · 媒體大戰最高潮',
      },
      choices: [
        {
          id: 'jaw_r20_ratings_bomb',
          toneLabel: '七夜連環爆',
          label: '全台灣同步直播「一刀未剪對質白板」，歡迎執政黨部長隨時 Call-in 來戰！',
          speechText:
            '「說我抹黑？歡迎行政院部長今晚九點進棚對質！不敢來就是默認全部屬實！」',
          hint: '全台聲量與藍營士氣飆破極限，綠營陷入被動防守！',
          statDelta: { unity: 8, momentum: 16, funds: -5, ccpTension: 0, japanPosture: 2 },
          swing: { north: 1.5, central: 1.4, south: 0.7, dppShift: -1.3 },
          pushReactions: [
            { type: '推', author: 'living_room', text: '我家阿公連八點檔都不看了整晚鎖定這台，真的打到痛處' },
          ],
          mediaReaction: '全台客廳話題連續一週被《大清算特輯》主導。',
        },
        {
          id: 'jaw_r20_public_welfare',
          toneLabel: '民生實錘',
          label: '把後三天特輯改成「青年低薪、勞保破產與健保點值解決白皮書」，展現執政藍圖！',
          speechText:
            '「揭弊只是手段，讓年輕人加薪、讓醫護不再過勞，才是我們進重慶南路的目標！」',
          hint: '醫護界與中間選民強烈共鳴！',
          statDelta: { unity: 6, momentum: 9, funds: 7, ccpTension: 0, japanPosture: 4 },
          swing: { north: 1.3, central: 1.2, south: 0.8, tppShift: -0.9 },
          pushReactions: [
            { type: '推', author: 'nurse_tw', text: '終於有人認真講健保點值跟醫護過勞了！' },
          ],
          mediaReaction: '醫護工會與教師團體表態給予高度肯定。',
        },
      ],
    },
  },

  // =========================================================
  // 5. 鄭麗文：戰狼女戰神 · 野百合舊照 · 立院對罵 · 兩岸路線交鋒
  // =========================================================
  cheng: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 鄭麗文] 1988 野百合與昔日民進黨黨證大翻車現場！',
      title: '【麗文專場】綠營翻出你 30 年前穿綠背心抗議照片狂洗「政治叛徒」，全網暴動！',
      situationBrief:
        '二二八連假，民進黨青年部整理出你早年參與野百合學運與民進黨時期演講影片做成對比短片，試圖讓你同時被深藍與深綠唾棄。',
      ccpNotice: '大陸網友第一次知道鄭麗文早年竟是綠營健將，討論熱度飆高。',
      japanNotice: '美日研究員剖析台灣政黨重組與政治人物光譜流動現象。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '理想可以轉變，但背叛當年共同反抗威權的民主初心，選民會看得一清二楚！',
        body: '「從街頭改革者變成黨國路線捍衛者，這條路究竟為了什麼？」',
        likesLabel: '5.1萬愛心 · 昔日戰友翻臉',
      },
      choices: [
        {
          id: 'cheng_r4_turn_tables',
          toneLabel: '大逆襲金句',
          label: '拍桌怒吼：「不是我變了，是民進黨變成當年我們最討厭的貪腐威權怪物！」',
          speechText:
            '「我年輕時追求的是清廉、反對一黨獨大！今天民進黨貪腐、控制媒體、養網軍打壓異己！我今天站在這裡，就是要推翻這個新威權！」',
          hint: '神級反殺！中間與年輕反綠選民起立鼓掌，聲量核爆！',
          statDelta: { unity: 9, momentum: 18, funds: 5, ccpTension: 0, japanPosture: 4 },
          swing: { north: 1.5, central: 1.3, south: 0.7, dppShift: -1.4 },
          pushReactions: [
            { type: '推', author: 'ex_green_voter', text: '幹 這句「不是我變了是民進黨變了」直接打穿百萬老綠男心防！' },
          ],
          mediaReaction: '這段一分鐘反殺影片在脆與 YouTube 累計突破四百萬次觀看。',
        },
        {
          id: 'cheng_r4_deep_blue_pledge',
          toneLabel: '忠誠宣言',
          label: '深鞠躬向國民黨致敬：「正因為看透綠營本質，我此生誓死捍衛中華民國！」',
          speechText:
            '「沒有比看清真相的悔悟者更堅定的戰士！三民主義萬歲！國民黨萬歲！」',
          hint: '深藍疑慮全消、黨內團結大幅提升！',
          statDelta: { unity: 14, momentum: 9, funds: 8, ccpTension: -2, japanPosture: 0 },
          swing: { east: 1.5, islands: 1.5, central: 0.7 },
          pushReactions: [
            { type: '推', author: 'kmt_elder', text: '鄭主席這二十年幫國民黨擋了多少子彈，深藍絕對力挺！' },
          ],
          mediaReaction: '黃復興系統全面消除心結，全力投入動員。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 鄭麗文] 昔日綠營話術全揭秘：脆文降維打擊！',
      title: '【麗文專場】你開直播逐條拆解民進黨圖卡 SOP 與側翼動員暗號，綠營社群群組集體崩潰！',
      situationBrief:
        '五月在脆上，你運用當年對綠營選舉機器極度熟悉的經驗，逐一預言對手明天會發什麼抹紅標題與新聞通稿，結果百分之百命中！',
      ccpNotice: '國台辦研究員震驚記錄「鄭麗文太懂綠營輿論戰套路」。',
      japanNotice: '美日社群研究學者驚呼這簡直是台灣版的輿論情報戰教材。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '停止用陰謀論抹黑基層志工與支持者的自發創作！',
        body: '「把公民自發聲援貶低成SOP操作，是對台灣民主最大的侮辱！」',
        likesLabel: '3.0萬愛心 · 側翼集體破防',
      },
      choices: [
        {
          id: 'cheng_r9_sop_expose',
          toneLabel: '內行人開箱',
          label: '公布《側翼圖卡九大話術bingo卡》，號召脆友天天核對民進黨公關套路！',
          speechText:
            '「每次執政出包就喊抗中保台、每次問電價就喊親中賣台！來，全台灣網友拿這張 Bingo 卡出來對！」',
          hint: '全網瘋玩 Bingo 卡！白營年輕人笑翻轉推，綠營聲勢受挫！',
          statDelta: { unity: 6, momentum: 17, funds: 4, ccpTension: 0, japanPosture: 0 },
          swing: { north: 1.4, central: 1.3, south: 0.6, dppShift: -1.3, tppShift: -0.9 },
          setFlags: ['threads_shitposter'],
          pushReactions: [
            { type: '推', author: 'threads_bingo', text: '幹 今天剛喊完一條抗中保台我就連成一條線了，太神準' },
          ],
          mediaReaction: '「鄭麗文 Bingo 卡」讓執政黨公關部門連續一週不敢發慣用口號。',
        },
        {
          id: 'cheng_r9_female_voter',
          toneLabel: '女力剛柔',
          label: '改打「職業婦女育兒、高物價與治安防護網」，展現女戰神溫柔實幹一面',
          speechText:
            '「上戰場要兇，顧家庭要細心！台灣女性撐起半邊天，我們不該只活在口水戰裡！」',
          hint: '女性與中間選民明顯回暖，糧草穩定進帳。',
          statDelta: { unity: 5, momentum: 7, funds: 8, ccpTension: 0, japanPosture: 4 },
          swing: { north: 1.2, central: 1.1, south: 0.7 },
          pushReactions: [
            { type: '推', author: 'working_mom', text: '女政治人物這樣論述真的很有說服力' },
          ],
          mediaReaction: '女性選民支持率創本季新高。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 鄭麗文] 全民防禦論戰：女性義務役與國會女戰神！',
      title: '【麗文專場】突拋「台灣全民國防性別平權＋志願役加薪兩倍」，PTT 八卦版蓋出五千樓！',
      situationBrief:
        '盛夏兵役與國防爭議延燒，你拋出震撼提案：把募兵薪水翻倍、建立現代化後備體系，同時嗆問男綠委「沒當過兵憑什麼整天叫別人上戰場！」',
      ccpNotice: '對岸軍事評論員嘲諷台灣募兵缺口大。',
      japanNotice: '美日軍事顧問團對「志願役大幅加薪＋精實化」表示高度興趣。',
      rivalPost: {
        platform: 'PTT 八卦版',
        authorName: '賴清德',
        authorRole: '國防改革論戰',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '[新聞] 兵役改革是全民防衛決心，不能只靠口水煽動性別與軍種對立！',
        body: '「在野黨一邊刪國防預算一邊喊加薪，財政紀律在哪裡？」',
        likesLabel: '推: 爆 · 5,200則軍事與兵役大戰',
      },
      choices: [
        {
          id: 'cheng_r14_soldier_pay',
          toneLabel: '國軍加薪反殺',
          label: '怒拍國防預算表：「砍的是浪費的側翼宣傳費，省下來的錢全部給第一線國軍弟兄加薪！」',
          speechText:
            '「把一線志願役跟義務役待遇拉到業界水準，有尊嚴才有戰力！不像某些人只會叫義務役當廉價勞工！」',
          hint: '年輕役男與現役軍人家庭暴漲，美日態度升溫！',
          statDelta: { unity: 7, momentum: 14, funds: -4, ccpTension: 5, japanPosture: 9 },
          swing: { north: 1.2, central: 1.2, east: 1.4, islands: 1.8, tppShift: -1.1 },
          pushReactions: [
            { type: '推', author: 'army_conscript', text: '把宣傳費拿來加薪我直接投爆鄭麗文，現在兵營薪水真的太可憐' },
          ],
          mediaReaction: '服役青年與軍眷社群獲得壓倒性好評。',
        },
        {
          id: 'cheng_r14_anti_war_march',
          toneLabel: '和平女聲',
          label: '改走「母親與姊妹不要戰爭」和平訴求，主打恢復海峽對話降溫！',
          speechText:
            '「沒有一個家庭希望孩子上戰場！最強的國防是智慧外交與避免戰爭！」',
          hint: '大幅降溫台海危機，但美日鷹派微幅皺眉。',
          statDelta: { unity: 6, momentum: 7, funds: 5, ccpTension: -14, japanPosture: -7 },
          swing: { central: 1.1, south: 0.4, islands: 1.5 },
          pushReactions: [
            { type: '推', author: 'taiwan_mom', text: '和平避戰才是所有媽媽最在乎的' },
          ],
          mediaReaction: '婦女社團與地方宗教界熱烈響應。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 鄭麗文] 黨主席直球定生死：黨中央動員總清算',
      title: '【麗文專場】選前兩個月爆出黨內山頭留一手不動員，你親自拿「黨紀＋輔選經費」壓陣！',
      situationBrief:
        '十月底地方探子回報幾個縣市組織居然還沒全面啟動，你決定立刻召開閉門中常會攤牌！',
      ccpNotice: '北京緊盯國民黨內部選前凝聚力是否足夠。',
      japanNotice: '美日觀察家注視黨主席是否能徹底駕馭藍營地方山頭。',
      rivalPost: {
        platform: 'PTT 政黑版',
        authorName: '黃國昌',
        authorRole: '民眾黨觀察員',
        authorHandle: 'KuoChang_TPP',
        portraitKey: 'huang',
        headline: '[討論] 國民黨內鬼抓到了嗎？每次大選都在最後兩個月內鬨！',
        body: '「自己家裡山頭都整合不了，怎麼跟民進黨打延長賽？」',
        likesLabel: '推: 720 · 藍營大老繃緊神經',
      },
      choices: [
        {
          id: 'cheng_r20_iron_party',
          toneLabel: '鐵腕整合',
          label: '下達最後通牒：「誰這次不全力輔選，2028 後全部不提名！」直接壓服山頭！',
          speechText:
            '「要嘛一起進總統府吃香喝辣，要嘛一起回家種田！全黨給我動起來！」',
          hint: '糧草與組織盤瞬間啟動，雖有微怨但整體團結大補！',
          statDelta: { unity: 11, momentum: 9, funds: 12, ccpTension: 0, japanPosture: 0 },
          swing: { north: 0.9, central: 1.3, east: 1.4, south: 0.8 },
          pushReactions: [
            { type: '推', author: 'blue_worker', text: '黨主席硬起來嚇阻地方偷懶，總算有魄力了' },
          ],
          mediaReaction: '各地競總隔日全數掛出聯合巨幅看板。',
        },
        {
          id: 'cheng_r20_charisma_tour',
          toneLabel: '全台戰車掃街',
          label: '乾脆自己跳上吉普車從基隆站到屏東，「不靠山頭靠十萬鐵粉自己衝！」',
          speechText:
            '「我鄭麗文一隻麥克風站在戰車上，一樣把全台翻藍給你們看！」',
          hint: '空戰聲量與南部士氣狂飆，糧草消耗較多。',
          statDelta: { unity: 4, momentum: 16, funds: -5, ccpTension: 0, japanPosture: 2 },
          swing: { north: 1.0, south: 1.6, central: 1.0 },
          pushReactions: [
            { type: '推', author: 'kmt_fan', text: '戰車女戰神太燃了！南部下雨照掃給你推！' },
          ],
          mediaReaction: '媒體拍攝她淋雨嘶吼的畫面成為本週最強熱點。',
        },
      ],
    },
  },

  // =========================================================
  // 6. 傅崐萁：花蓮王 · 花東環島高鐵 · 北京伴手禮 · 地方帝國
  // =========================================================
  fu: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 傅崐萁] 打穿中央山脈！兩兆環島高鐵與蘇花安大放送',
      title: '【花蓮王專場】開春第一支票直接喊出「中央山脈隧道高鐵＋全台灣六都變十六都」！',
      situationBrief:
        '二二八連假東部車潮大塞車，你站上花蓮火車站廣場直接甩出「兩兆台幣環島高速鐵路網」模型，交通部與財政部集體喊救命。',
      ccpNotice: '大陸基建網民留言：「這效率跟我們基建狂魔有得拚」。',
      japanNotice: '日本新幹線財團立刻派代表致意詢問是不是要買高鐵列車。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '打穿中央山脈涉及地震斷層與國家財政破產風險！國家建設不能亂開空頭支票！',
        body: '「兩兆元會排擠全台灣的社福、健保與國防預算，請花蓮王不要把國庫當花蓮縣庫！」',
        likesLabel: '4.5萬愛心 · 兩兆支票大亂鬥',
      },
      choices: [
        {
          id: 'fu_r4_hualien_kingdom',
          toneLabel: '花蓮王霸氣',
          label: '拍桌嗆回去：「台北蓋十條捷運都沒關係，花蓮台東人想安全回家就叫破產？這就是綠色傲慢！」',
          speechText:
            '「沒有環島軌道、沒有東部發展，算什麼一體的台灣？誰阻擋花東人安全回家的路，就是台灣公敵！」',
          hint: '花東直接藍到發紫、地方糧草大補，北部都會中產略微擔憂財政。',
          statDelta: { unity: 8, momentum: 11, funds: 14, ccpTension: 0, japanPosture: 0 },
          swing: { east: 3.8, central: 0.9, north: -0.6, specificCounties: { 花蓮縣: 5.0, 台東縣: 3.5 } },
          setFlags: ['hualien_kingdom'],
          pushReactions: [
            { type: '推', author: 'hualien_local', text: '真的每次蘇花斷掉都要繞半個台灣回家，只有傅總召幫東部講話！' },
          ],
          mediaReaction: '「花東交通平權」話題讓東部與苗栗地區支持率直衝天花板。',
        },
        {
          id: 'fu_r4_bot_package',
          toneLabel: '國際 BOT',
          label: '改口「用國際 BOT 與美日主權基金投資建設」，一毛不花國庫也能通花東！',
          speechText:
            '「用民間資本與國際工程技術做 BOT！不舉債不排擠預算，一樣讓花東起飛！」',
          hint: '美日與財經界放下戒心，北部微漲同時保住花東！',
          statDelta: { unity: 5, momentum: 7, funds: 11, ccpTension: 0, japanPosture: 6 },
          swing: { east: 2.0, north: 0.6, central: 0.8 },
          pushReactions: [
            { type: '推', author: 'biz_daily', text: '講成 BOT 招商至少在財經界講得通了' },
          ],
          mediaReaction: '工商媒體給予「務實修正」評價。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 傅崐萁] 北京破冰伴手禮與桃園機場大包圍',
      title: '【花蓮王專場】帶團赴陸返台，海關打開行李箱驚見全是「花蓮西瓜宣傳冊與大陸文旦訂單」？',
      situationBrief:
        '五月你快閃赴陸協調農產與觀光開放，返台在桃園機場遭數十名青鳥側翼與綠委開直播包圍質疑「是不是帶回密室指令」。',
      ccpNotice: '國台辦高調宣布恢復部分福建居民赴馬祖與花蓮旅遊試點。',
      japanNotice: '華府與東京智庫高度警惕藍營赴陸行程背後的政治交換條件。',
      rivalPost: {
        platform: 'PTT 政黑版',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '立院黨鞭兼總統候選人在中共軍演未歇之際密訪北京，到底談了什麼交換條件？',
        body: '「觀光客不能靠矮化國格換來，請向全國人民公開所有會面紀錄！」',
        likesLabel: '推: 520 噓: 890 · 桃機堵人直播',
      },
      choices: [
        {
          id: 'fu_r9_open_suitcase',
          toneLabel: '當場開箱',
          label: '直接拉開行李箱給記者拍：「裡面只有花蓮觀光DM、農產品報價單跟給鄉親的訂單！」',
          speechText:
            '「民進黨斷了台灣觀光飯店跟農民的活路，我去幫台灣百工百業搶訂單、救花蓮地震後的飯店業！光明磊落！」',
          hint: '花東旅遊業與糧草大暴衝，本島略微兩極、美日小降！',
          statDelta: { unity: 7, momentum: 10, funds: 14, ccpTension: -10, japanPosture: -8 },
          swing: { east: 2.8, central: 0.8, north: -0.7, south: -0.9, specificCounties: { 花蓮縣: 3.5, 金門縣: 3.0 } },
          pushReactions: [
            { type: '推', author: 'hualien_hotel', text: '花蓮飯店快倒光了，有人願意幫觀光客拉回來就是恩人' },
            { type: '噓', author: 'tpe_hawk', text: '真的只有DM？誰信啊' },
          ],
          mediaReaction: '觀光旅館公會公開發聲感謝「總算看見復甦希望」。',
        },
        {
          id: 'fu_r9_hard_line_at_beijing',
          toneLabel: '當面抗議軍機',
          label: '公開宣稱「我在北京當面告訴對方：軍機不停止繞台、什麼交流免談！」',
          speechText:
            '「敢去北京還敢當面替台灣人嗆共軍停止繞台，民進黨哪個人做得到？」',
          hint: '本島驚呆！大幅洗白親中標籤，同時美日態度回穩！',
          statDelta: { unity: 3, momentum: 15, funds: 5, ccpTension: 8, japanPosture: 9 },
          swing: { north: 1.3, central: 1.0, south: 0.6, dppShift: -0.8 },
          pushReactions: [
            { type: '推', author: 'middle_tw', text: '如果真的敢當面嗆停飛軍機，那還真的沒話說給推' },
          ],
          mediaReaction: '外媒驚訝報導藍營地方強權對北京展現意外強硬姿態。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 傅崐萁] 花蓮外海解放軍軍艦逼近：太平洋花蓮王反制！',
      title: '【花蓮王專場】解放軍遠海編隊越過東部海域！你直接搭漁船出海開直播怒嗆：「敢打花蓮試試看！」',
      situationBrief:
        '東部戰區艦艇繞行至台灣東部外海，距離花蓮七星潭僅數十海里。正當台北政論節目驚慌討論時，你居然直接穿著救生衣登上賞鯨船開直播！',
      ccpNotice: '東部戰區艦橋官兵一臉困惑看著台灣賞鯨船朝這邊開過來開直播。',
      japanNotice: '美日第七艦隊與沖繩基地大感意外，把花蓮王列為「不可預測的非對稱變數」。',
      rivalPost: {
        platform: '緊急軍情電報',
        authorName: '賴清德',
        authorRole: '國安會議聲明',
        authorHandle: '@presidential_office',
        portraitKey: 'lai',
        headline: '東部海域軍事動態均由國軍嚴密監控，民意代表切勿擅自乘民船接近危險海空域！',
        body: '「國防不是海上直播秀，請尊重海軍與海巡的專業管制！」',
        likesLabel: '4.9萬轉發 · 七星潭直播爆表',
      },
      choices: [
        {
          id: 'fu_r14_pacific_king',
          toneLabel: '海上霸主直播',
          label: '迎著海風大喊：「花蓮人連九級地震都沒怕過，還怕你們幾艘船？中華民國萬歲！」',
          speechText:
            '「七星潭是台灣人的太平洋後花園！今天我在這裡告訴全世界：花蓮王跟兩千三百萬人寸步不退！」',
          hint: '全台爆紅！本島與花東同時破防狂讚，但中共壓力直接飆升！',
          statDelta: { unity: 10, momentum: 20, funds: 7, ccpTension: 14, japanPosture: 10 },
          swing: { east: 3.2, north: 1.1, central: 1.0, south: 0.8, specificCounties: { 花蓮縣: 4.0 } },
          setFlags: ['anti_ccp_hawk'],
          pushReactions: [
            { type: '推', author: 'ptt_shock', text: '幹 花蓮王坐賞鯨船出去嗆解放軍這畫面太史詩了吧哈哈哈哈' },
          ],
          mediaReaction: '賞鯨船對峙影片在全亞洲爆紅，被網友封為「太平洋真男人」。',
        },
        {
          id: 'fu_r14_harbor_relief',
          toneLabel: '港口慰問',
          label: '改在花蓮港慰勞海巡與空軍佳山基地官兵，發送五百盒花蓮麻糬加菜！',
          speechText:
            '「佳山基地保護東部天際線！國軍弟兄辛苦了，後方補給我全包！」',
          hint: '軍眷與美日安保圈大幅肯定，穩健安全。',
          statDelta: { unity: 9, momentum: 8, funds: 5, ccpTension: 3, japanPosture: 8 },
          swing: { east: 2.0, north: 0.7 },
          pushReactions: [
            { type: '推', author: 'airforce_fam', text: '慰勞佳山官兵送麻糬很實在，軍眷推' },
          ],
          mediaReaction: '國軍基層社群流出溫馨加菜照。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 傅崐萁] 花蓮王國與苗栗國「東西雙雄結盟」大新聞！',
      title: '【花蓮王專場】選前兩個月竟與苗栗縣長簽署《地方自治建設互助盟約》，脆友驚呼「兩國建交」？',
      situationBrief:
        '十月底你突發奇想拉著苗栗、南投、台東等非都會縣市組成「地方建設聯盟」，喊出「不被台北中央欺負」，結果脆友集體大喊「花蓮王國與苗栗共和國建交啦」！',
      ccpNotice: '大陸學者完全看不懂台灣這波「苗栗國與花蓮國」到底是不是新的地方制度。',
      japanNotice: '美日地方交流協會禮貌發函詢問未來是不是要辦兩處雙重簽證。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '黃國昌',
        authorRole: '民眾黨驚呼',
        authorHandle: 'KuoChang_TPP',
        portraitKey: 'huang',
        headline: '把地方財政劃分講成地方王國結盟？太離譜了吧！到底誰是中央政府？',
        body: '「財劃法修法要講清楚，不是在脆上玩地方諸侯割據遊戲！」',
        likesLabel: '4.4萬愛心 · 苗栗國迷因大爆發',
      },
      choices: [
        {
          id: 'fu_r20_miaoli_pact',
          toneLabel: '地方諸侯大聯盟',
          label: '笑著揮手：「沒錯！財劃法沒過之前，我們花蓮、苗栗、南投先互助建設，石虎跟紅面鴨建交！」',
          speechText:
            '「中央政府卡地方預算卡了多少年？非六都縣市今天大團結，把統籌分配款搶回來！」',
          hint: '極易觸發「苗栗國＆花蓮王國獨立建交」隱藏結局！非六都鐵票爆衝！',
          statDelta: { unity: 7, momentum: 15, funds: 12, ccpTension: 0, japanPosture: 0 },
          swing: {
            east: 3.5,
            central: 1.8,
            north: -0.9,
            specificCounties: { 苗栗縣: 4.8, 花蓮縣: 4.5, 南投縣: 2.5 },
          },
          setFlags: ['hualien_kingdom'],
          pushReactions: [
            { type: '推', author: 'miaoli_king', text: '苗栗國外交部宣布與花蓮王國建立永久友好邦交！！' },
          ],
          mediaReaction: '苗栗與花蓮同時衝上地方支持率歷史新高，台北名嘴集體傻眼。',
        },
        {
          id: 'fu_r20_fiscal_act',
          toneLabel: '正經財劃法',
          label: '嚴肅宣布「當選立刻落實新版財劃法」，讓台北與非六都共享半導體稅收！',
          speechText:
            '「不是要搞對立，是要讓每個台灣孩子都有一樣的教育與醫療資源！」',
          hint: '六都以外全數加分、北部反感降到最低。',
          statDelta: { unity: 9, momentum: 7, funds: 9, ccpTension: 0, japanPosture: 3 },
          swing: { east: 2.0, central: 1.5, south: 0.7 },
          pushReactions: [
            { type: '推', author: 'chiayi_tax', text: '財劃法真的二十幾年沒修過，非六都窮太久了' },
          ],
          mediaReaction: '各縣市議會跨黨派給予正面回應。',
        },
      ],
    },
  },

  // =========================================================
  // 7. 侯友宜：侯侯做代誌AI複讀機 · 關公兄弟 · 核廢料轉彎 · 警察之光
  // =========================================================
  hou: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 侯友宜] 「侯侯做代誌」AI 語音複讀機震撼全網！',
      title: '【侯市長專場】脆友設計 50 題超毒陷阱題圍堵聯訪，你竟然全用「侯侯做代誌」完美擋下！',
      situationBrief:
        '二二八記者會現場，綠白記者與側翼網紅串通提出五十個極端尖銳問題。幕僚冷汗直流時，你微笑啟動「八字真言絕對防禦結界」！',
      ccpNotice: '大陸翻譯官抓狂：「這八個閩南語發音的漢字到底是什麼哲學密碼？」',
      japanNotice: '美日記者團學會了第一個台灣政治詞彙：「Hou-Hou-Zuo-Dai-Zhi」。',
      rivalPost: {
        platform: 'PTT 八卦版',
        authorName: '黃國昌',
        authorRole: '民眾黨崩潰質疑',
        authorHandle: 'KuoChang_TPP',
        portraitKey: 'huang',
        headline: '[問卦] 問他核電、問他台海、問他萊豬，為什麼侯友宜只會講那八個字？',
        body: '「太離譜了！總統候選人不是人肉錄音機，國家政策必須講清楚說明白！」',
        likesLabel: '推: 爆 · 八字真言洗腦全台',
      },
      choices: [
        {
          id: 'hou_r4_eight_words_shield',
          toneLabel: '絕對防禦結界',
          label: '面帶厚實微笑繼續補刀：「大家團結、不要製造對立、台灣加油、侯侯做代誌！」',
          speechText:
            '「我做過四十年刑事警察，衝過槍林彈雨！少噴口水、多做事，侯侯做代誌就對了！」',
          hint: '解鎖「侯侯做代誌」AI 催眠結局重要旗標！長輩安心、年輕人做成洗腦電音！',
          statDelta: { unity: 8, momentum: 14, funds: 6, ccpTension: -3, japanPosture: 2 },
          swing: { north: 1.3, central: 0.9, south: 0.7, specificCounties: { 新北市: 2.3 } },
          setFlags: ['hou_eight_words'],
          pushReactions: [
            { type: '推', author: 'newtaipei_bot', text: '侯侯做代誌（點頭）（微笑）（結界展開）' },
          ],
          mediaReaction: '《侯侯做代誌 Lo-Fi 讀書歌單》在 YouTube 播放突破兩百萬次。',
        },
        {
          id: 'hou_r4_cop_record',
          toneLabel: '鐵漢刑事魂',
          label: '突然眼神變銳利掏出治安數據：「談打詐跟治安，全場沒一個有資格教我辦案！」',
          speechText:
            '「詐騙集團一年騙走人民上千億！政府整天在脆上吵架抓不到車手，我當選半年內掃平詐團！」',
          hint: '全國打詐怒火共鳴！吸收大量中產與受害家屬選票！',
          statDelta: { unity: 7, momentum: 13, funds: 7, ccpTension: 0, japanPosture: 4 },
          swing: { north: 1.5, central: 1.3, south: 0.9, dppShift: -1.1 },
          pushReactions: [
            { type: '推', author: 'anti_scam_tw', text: '講到打詐真的只有刑警出身的侯友宜講話最有壓迫感' },
          ],
          mediaReaction: '治安與反詐主題成功洗刷口吃印象。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 侯友宜] 「關公重義氣」神像直播誓師！',
      title: '【侯市長專場】深藍質疑你不夠義氣？你當場搬出兩尺高關公銅像直播背出「忠義千秋」！',
      situationBrief:
        '五月黨內鷹派重提舊帳懷疑你輔選不夠熱血，你決定在競選總部正中央供奉關聖帝君，邀全黨同志喝一碗大碗茶表忠心！',
      ccpNotice: '福建東山關帝廟管委會隔海關注這波關公信仰熱潮。',
      japanNotice: '橫濱中華街關帝廟僑胞透過日媒觀看這場罕見的政壇發誓直播。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '民主政治看的是憲政制度與人民託付，不是在總部擺神像拜把子！',
        body: '「用江湖義氣取代現代治理，令人擔憂台灣回到人治社會！」',
        likesLabel: '3.3萬愛心 · 關公信徒大辯論',
      },
      choices: [
        {
          id: 'hou_r9_guangong_oath',
          toneLabel: '關公重然諾',
          label: '手按關公像高喊：「我不背叛朋友、不背叛中華民國！言出必行、重然諾！」',
          speechText:
            '「做人最重要就是一個『信』字！我對得起兄弟、對得起基層員警、更對得起這塊土地！」',
          hint: '藍營草根與警察警眷、地方大哥全面歸隊！',
          statDelta: { unity: 14, momentum: 9, funds: 11, ccpTension: 0, japanPosture: 0 },
          swing: { north: 1.1, central: 1.2, south: 1.0, specificCounties: { 新北市: 2.0, 嘉義縣: 1.5 } },
          setFlags: ['hou_eight_words'],
          pushReactions: [
            { type: '推', author: 'chiayi_bro', text: '嘉義樸子出來的孩子拜關公講信用，南部人吃這套！' },
          ],
          mediaReaction: '地方派系與嘉義鄉親好感度大幅回溫。',
        },
        {
          id: 'hou_r9_modern_admin',
          toneLabel: '新北實績',
          label: '不走江湖路線，直接攤開「新北三環六線＋五股垃圾山變夏綠地」政績海報！',
          speechText:
            '「拜關公是求心安，贏選舉靠的是五十條軌道與五股垃圾山翻轉！」',
          hint: '北部都會選民點頭，糧草與市政分數穩健。',
          statDelta: { unity: 6, momentum: 5, funds: 8, ccpTension: 0, japanPosture: 5 },
          swing: { north: 1.4, specificCounties: { 新北市: 1.8 } },
          pushReactions: [
            { type: '推', author: 'wugu_resident', text: '五股夏綠地真的差超多，實事推' },
          ],
          mediaReaction: '市政成績單成功壓過江湖梗嘲諷。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 侯友宜] 新北核一核二核四立場終極考題！',
      title: '【侯市長專場】七月大跳電，賴清德直球問你：「新北核廢料到底放不放在新北市？」',
      situationBrief:
        '盛夏缺電危機下，核一核二與核四都在新北市境內。對手精準切入這道你當年最痛苦的死穴考題！',
      ccpNotice: '大陸能源學者評論台灣核能政策反覆無常。',
      japanNotice: '美日能源與半導體界急切等待你對新北核電廠的明確答案。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '侯市長當年親手擋下核一核二乾式貯存！現在選總統又要重啟核電，請向新北市民道歉！',
        body: '「沒有能力處理核廢料，就沒有資格講重啟核電！」',
        likesLabel: '4.8萬愛心 · 直擊侯友宜最大弱點',
      },
      choices: [
        {
          id: 'hou_r14_nuclear_yes',
          toneLabel: '勇敢轉彎承擔',
          label: '正面承擔：「以前我當市長為市民把關安全！現在我選總統，依法安全重啟、核廢中央扛！」',
          speechText:
            '「只要通過國際原子能總署最高安全檢查，我願擔起國家領導人責任，讓台灣不缺電、電價不亂漲！」',
          hint: '成功解套最大弱點！竹科、工商界與美日代表拍手叫好！',
          statDelta: { unity: 8, momentum: 11, funds: 10, ccpTension: 0, japanPosture: 9 },
          swing: { north: 1.4, central: 1.2, specificCounties: { 新竹市: 1.9, 新北市: 0.8 } },
          setFlags: ['pro_nuclear'],
          pushReactions: [
            { type: '推', author: 'tech_park', text: '終於不閃躲直接扛起來了，為了不跳電給推' },
          ],
          mediaReaction: '產業界鬆一口氣，脆上綠營打擊力道減半。',
        },
        {
          id: 'hou_r14_eight_words_escape',
          toneLabel: '再度發動結界',
          label: '微笑再唸咒語：「核安第一、沒有安全就沒有核電、大家團結侯侯做代誌！」',
          speechText:
            '「安全最重要！中央要負起責任、不能卸責地方，我們侯侯把安全顧好！」',
          hint: '極強防禦力但略失攻擊性，新北鐵票紋絲不動。',
          statDelta: { unity: 3, momentum: 8, funds: 3, ccpTension: 0, japanPosture: -3 },
          swing: { north: 0.4, specificCounties: { 新北市: 1.2 } },
          setFlags: ['hou_eight_words'],
          pushReactions: [
            { type: '噓', author: 'nuclear_fan', text: '到底要不要開啦講清楚好不好' },
          ],
          mediaReaction: 'PTT 又開始倒數計算「侯侯做代誌」講了幾百次。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 侯友宜] 「中華民國是我們的國家」與美日治安同盟！',
      title: '【侯市長專場】訪美日回國演說：竟把美日印太合作講成「全球警察聯防打擊黑道與壞人」？',
      situationBrief:
        '十月底外交總結，你用最接地氣的「老刑警語錄」詮釋台美日印太安全與釣魚台和平護漁，讓外交官既好笑又莫名覺得合理！',
      ccpNotice: '北京外交圈聽完這段「壞人與警察比喻」不知該生氣還是翻白眼。',
      japanNotice: '美日駐台官員驚訝發現這種大白話反而讓基層選民一秒聽懂台美日安保。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '國際政治不是派出所抓小偷！需要精準的外交戰略與民主同盟！',
        body: '「請候選人不要把複雜的地緣戰略簡化成警察抓壞人！」',
        likesLabel: '2.8萬愛心 · 刑警外交學',
      },
      choices: [
        {
          id: 'hou_r20_cop_diplomacy',
          toneLabel: '警察大白話',
          label: '笑著補一句：「社區平安靠鄰居守望相助！台灣與美日就是社區好鄰居、一起侯侯顧好海峽！」',
          speechText:
            '「講那麼多艱澀外交名詞阿公阿嬤聽得懂嗎？強大自己、結交美日好鄰居、不挑釁也不怕事，就是這麼簡單！」',
          hint: '美日好感與基層阿公阿嬤同時買單，八字真言集大成！',
          statDelta: { unity: 8, momentum: 11, funds: 7, ccpTension: 2, japanPosture: 10 },
          swing: { north: 1.3, central: 1.1, south: 0.9, specificCounties: { 新北市: 1.6 } },
          setFlags: ['hou_eight_words'],
          pushReactions: [
            { type: '推', author: 'grandma_tw', text: '阿嬤真的聽得懂這句！不用整天寫英文論文啦' },
          ],
          mediaReaction: '「社區鄰居安保論」意外成為大白話外交經典。',
        },
        {
          id: 'hou_r20_police_benefits',
          toneLabel: '警消醫護全挺',
          label: '直接端出「全國警消醫護危勞加給倍增＋退休所得替代率檢討」，搶攻百萬軍警公教家屬！',
          speechText:
            '「前線兄弟拿命保護台灣，國家不能虧待他們一分錢！」',
          hint: '軍警公教眷屬鐵票全面沸騰！',
          statDelta: { unity: 10, momentum: 8, funds: 5, ccpTension: 0, japanPosture: 3 },
          swing: { north: 1.4, central: 1.0, east: 1.5, islands: 1.5 },
          pushReactions: [
            { type: '推', author: 'firefighter_tw', text: '警消加給真的等太久了，侯市長最懂基層苦' },
          ],
          mediaReaction: '退休警消總會動員數萬名家屬掃街拉票。',
        },
      ],
    },
  },

  // =========================================================
  // 8. 朱立倫：會計師精算師 · Excel讓6% · 換柱技能CD · 正常倫
  // =========================================================
  chu: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 朱立倫] 會計師拿 Excel 現場算「0.35 誤差範圍讓 6%」數學課！',
      title: '【朱會計專場】白營重提 2023 誤差範圍舊怨，你居然當場打開 Excel 拉出標準差公式教學！',
      situationBrief:
        '二二八連假，黃國昌在直播嘲諷國民黨當年「會計師數學奇蹟」，你按捺不住會計系博士的靈魂，在新聞台現場用大螢幕開 Excel 算民調統計學！',
      ccpNotice: '大陸理工科網友認真跟著你的 Excel 驗算標準差公式。',
      japanNotice: '美日智庫稱讚朱立倫是全台灣最冷靜（也最書呆子）的在野領袖。',
      rivalPost: {
        platform: 'PTT 八卦版',
        authorName: '黃國昌',
        authorRole: '民眾黨大怒咆哮',
        authorHandle: 'KuoChang_TPP',
        portraitKey: 'huang',
        headline: '[討論] 2027年了還在開 Excel 算正負3%等於6%？簡直太離譜了！！',
        body: '「小草沒辦法接受這種政治數學魔術！要合就拿出一點誠意！」',
        likesLabel: '推: 爆 · 統計學教授集體出動',
      },
      choices: [
        {
          id: 'chu_r4_excel_apology',
          toneLabel: '精算讓利',
          label: '立刻關掉 Excel 爽快說：「過去算太精是我的錯！這次 2028 我先讓、不讓小草受委屈！」',
          speechText:
            '「為了台灣大局，我朱立倫今天當著全台灣人的面放下精算表！在野只有一個目標：下架民進黨！」',
          hint: '黃國昌當場愣住！小草怒氣瞬間消散一半、藍白互信大漲！',
          statDelta: { unity: 5, momentum: 11, funds: 6, ccpTension: 0, japanPosture: 4 },
          swing: { north: 1.4, central: 1.1, tppShift: -1.4 },
          setFlags: ['blue_white_aligned'],
          pushReactions: [
            { type: '推', author: 'tpp_grass', text: '靠 朱立倫肯認錯不開 Excel 反而讓人不好意思再罵了' },
          ],
          mediaReaction: '政治評論員讚為「會計師最有人情味的一天」。',
        },
        {
          id: 'chu_r4_math_professor',
          toneLabel: '學術壓制',
          label: '頭鐵到底！「±3% 區間本來就是 6 個百分點！沒讀統計學不要亂帶風向！」',
          speechText:
            '「真理越辯越明，統計學不會因為聲音大聲就改變公式！」',
          hint: '深藍與台大財金系大笑拍手，但白營小草氣到翻桌！',
          statDelta: { unity: 7, momentum: 13, funds: 5, ccpTension: 0, japanPosture: 3 },
          swing: { north: 0.7, tppShift: 1.5 },
          setFlags: ['tpp_friction'],
          pushReactions: [
            { type: '噓', author: 'kp_math', text: '好喔 2028 藍營自己去拿6%數學獎吧再見' },
          ],
          mediaReaction: '「朱立倫統計課」迷因再度洗版 PTT。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 朱立倫] 黨部發不出便當？茶葉蛋半顆核銷風波！',
      title: '【朱會計專場】基層黨工匿名爆料「朱主席精算過頭，造勢便當只發一塊豆乾加半顆滷蛋」？',
      situationBrief:
        '五月爆料粉專貼出藍營地方黨部核銷單據，嘲諷會計師主席把競選經費省到連便當肉片都要秤重。',
      ccpNotice: '對岸網民笑稱「國民黨主席真是居家省錢過日子好手」。',
      japanNotice: '無外交影響，純屬台灣政黨內部行政八卦。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '民進黨社群嘲諷',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '連第一線基層工作人員的便當都要斤斤計較，怎麼相信能照顧兩千三百萬人福利？',
        body: '「好的政府懂得投資未來與照顧勞工，不是只會看損益表砍福利！」',
        likesLabel: '2.9萬愛心 · 茶葉蛋梗爆紅',
      },
      choices: [
        {
          id: 'chu_r9_double_chicken',
          toneLabel: '大雞腿補償',
          label: '當晚立刻自掏腰包請全國黨工吃「雙拼大雞腿便當＋珍奶」開直播謝罪！',
          speechText:
            '「省的是公家不該花的錢，對第一線兄弟我怎麼可能小氣？今天雞腿加倍、珍奶全糖！」',
          hint: '危機變喜劇！黨內團結大補血，糧草小扣但人心大悅！',
          statDelta: { unity: 12, momentum: 11, funds: -5, ccpTension: 0, japanPosture: 0 },
          swing: { north: 0.8, central: 0.9, south: 0.5 },
          pushReactions: [
            { type: '推', author: 'kmt_staff', text: '主席請雙拼雞腿我就原諒你十次單據審核！' },
          ],
          mediaReaction: '「雙拼大雞腿謝罪」讓年輕人覺得朱立倫意外可愛。',
        },
        {
          id: 'chu_r9_audit_dpp',
          toneLabel: '反查綠營帳',
          label: '甩出執政黨過去八年公關標案明細：「我省錢是為了不貪污！民進黨你們敢公開帳本嗎？」',
          speechText:
            '「每一分選民捐款我都當成救命錢精打細算！總比拿人民納稅錢買豪華官邸與網軍好一萬倍！」',
          hint: '理財與中產選民大讚清廉守紀律！',
          statDelta: { unity: 6, momentum: 9, funds: 11, ccpTension: 0, japanPosture: 3 },
          swing: { north: 1.2, central: 1.0, dppShift: -0.9 },
          pushReactions: [
            { type: '推', author: 'cpa_taiwan', text: '會計師查帳還是狠，一甩出標案表對面就安靜了' },
          ],
          mediaReaction: '清廉形象反攻奏效，募款明顯增加。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 朱立倫] 「美國線民」vs「親中賣台」雙面夾殺地獄！',
      title: '【朱會計專場】華府智庫讚你「最可靠的親美藍」，隔天深藍名嘴痛罵你「美國線民別選了」！',
      situationBrief:
        '七月你公開重申國民黨「親美、友日、和陸」三角平衡路線，不料深藍名嘴同時開砲罵你對美日太軟弱，綠營又說你親中，堪稱夾心餅乾地獄。',
      ccpNotice: '北京冷眼看你在深藍壓力下還敢不敢維持親美論述。',
      japanNotice: '美日駐台外交界力挺你的「親美友日」路線，視之為關鍵壓艙石。',
      rivalPost: {
        platform: 'PTT 政黑版',
        authorName: '賴清德',
        authorRole: '現任總統 · 民進黨',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '連黨內名嘴都不相信你的親美承諾！在野黨的國防外交路線徹底精神分裂！',
        body: '「一邊想討好華府東京、一邊又放任黨團卡軍購，誰會相信？」',
        likesLabel: '3.4萬愛心 · 夾心餅乾考驗',
      },
      choices: [
        {
          id: 'chu_r14_usjp_anchor',
          toneLabel: '堅定親美友日',
          label: '直接表態：「中華民國一直站在自由民主陣營！美日是百年盟友，我們更懂如何與北京溝通降險！」',
          speechText:
            '「既要美日安保信任、也要兩岸和平護欄！這不是精神分裂，這才是高難度的國家戰略平衡！」',
          hint: '美日態度飆升 +15！都會中間選民暴漲，深藍略不爽！',
          statDelta: { unity: -5, momentum: 9, funds: 9, ccpTension: -4, japanPosture: 15 },
          swing: { north: 1.8, central: 1.0, south: 0.6, specificCounties: { 台北市: 2.0, 新竹市: 1.8 } },
          setFlags: ['pro_japan_security'],
          pushReactions: [
            { type: '推', author: 'dc_thinktank', text: '只有朱立倫能講出這種同時穩住美日又降溫海峽的論述' },
          ],
          mediaReaction: '紐約時報與日本經濟新聞均給予正面篇幅。',
        },
        {
          id: 'chu_r14_deepblue_pacify',
          toneLabel: '安撫深藍',
          label: '緊急找深藍大老喝茶表態：「台灣利益第一！美國牛豬與過時軍購我們一樣敢說不！」',
          speechText:
            '「交朋友不代表當小弟！我們要求對等尊嚴的美台關係！」',
          hint: '深藍怒氣平息、團結回血，美日微降。',
          statDelta: { unity: 11, momentum: 5, funds: 6, ccpTension: -2, japanPosture: -7 },
          swing: { east: 1.2, islands: 1.2, central: 0.6 },
          pushReactions: [
            { type: '推', author: 'deepblue_hq', text: '早該講清楚我們不當美國小弟了' },
          ],
          mediaReaction: '黨內鷹派砲聲暫歇。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 朱立倫] 傳說技能「換柱 2.0」冷卻完畢？黨內防換將大作戰！',
      title: '【朱會計專場】倒數兩個月居然傳出有人想對你發動「反向換朱」！你拿出十二年累積的忍功反制！',
      situationBrief:
        '十月底某中常委突然提議「若民調未破四成是否啟動緊急備案」，全台灣瞬間刷爆「換柱大師要被換掉了嗎？技能反彈！」',
      ccpNotice: '對岸網民看傻：「國民黨每次選舉都要自己換一次人嗎？」',
      japanNotice: '美日媒體差點被這波「Swap-Chu 2.0」烏龍新聞嚇死。',
      rivalPost: {
        platform: 'PTT 八卦版',
        authorName: '黃國昌',
        authorRole: '民眾黨狂笑轉發',
        authorHandle: 'KuoChang_TPP',
        portraitKey: 'huang',
        headline: '[爆卦] 國民黨十二年一次的臨全會換將冷卻時間真的轉好了嗎？！',
        body: '「連主帥在最後兩個月都能被自己人討論換掉，太離譜了吧！」',
        likesLabel: '推: 爆 · 八卦版狂歡夜',
      },
      choices: [
        {
          id: 'chu_r20_lock_nomination',
          toneLabel: '終結內耗',
          label: '笑著自嘲：「換將技能早被我封存進博物館了！今天誰提換人就是幫賴清德助選！」',
          speechText:
            '「2015 年的痛我比誰都清楚，我們絕不再犯第二次！今天全黨把雙手疊在一起，一路衝進重慶南路！」',
          hint: '罕見展現強硬擔當！團結大補 +14，打破換將魔咒！',
          statDelta: { unity: 14, momentum: 11, funds: 9, ccpTension: 0, japanPosture: 3 },
          swing: { north: 1.2, central: 1.1, east: 1.0 },
          pushReactions: [
            { type: '推', author: 'kmt_dejavu', text: '自己玩自己換柱梗還順便拆彈，正常倫這次正常發揮而且超強' },
          ],
          mediaReaction: '中常會全體起立鼓掌，徹底終結雜音。',
        },
        {
          id: 'chu_r20_excel_win',
          toneLabel: '精算致勝',
          label: '當場投影最新內參交叉表：「看清楚！只要多催 4% 中間票我們就過半贏下 2028！」',
          speechText:
            '「數據不會騙人！不要自己嚇自己，按這張作戰圖去跑票，1 月 13 日一定贏！」',
          hint: '穩住金主與地方輔選幹部信心，糧草充沛！',
          statDelta: { unity: 8, momentum: 5, funds: 12, ccpTension: 0, japanPosture: 4 },
          swing: { north: 1.0, central: 1.0 },
          pushReactions: [
            { type: '推', author: 'campaign_mgr', text: '看到明確催票區間大家心就定了，衝啦！' },
          ],
          mediaReaction: '藍營幹部信心大幅回穩。',
        },
      ],
    },
  },

  // =========================================================
  // 9. 馬英九：死亡之握因果律 · 鹿茸古文 · 短紅褲晨跑 · 九二共識考試
  // =========================================================
  ma: {
    4: {
      round: 4,
      dateLabel: '2027.02 下',
      boardName: '[個人專場 · 馬英九] 「死亡之握」2028 因果律巡迴全場握手！',
      title: '【馬前總統專場】你走上二二八和解會場主動逐一與賴清德、蕭美琴、黃國昌「深情雙手緊握十秒」！',
      situationBrief:
        '二二八和解舞台上，現場鏡頭拍到敵營三位主將表情僵硬卻又不好意思拒絕前總統握手！PTT 瞬間炸出五千條「因果律已發動」預言！',
      ccpNotice: '大陸微博網友狂喊「千萬別跟馬先生握手太用力，這招玄學太強」。',
      japanNotice: '美日駐台代表微笑保持一公尺社交距離並用鞠躬代替握手。',
      rivalPost: {
        platform: 'PTT 八卦版',
        authorName: '賴清德',
        authorRole: '現任總統 · 緊急洗手中',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '[爆卦] 和解儀式後總統府緊急發放酒精乾洗手一百瓶給全體與會官員！',
        body: '「禮貌握手是民主風度，但請大家注意季節交替流感防疫！」',
        likesLabel: '推: 爆 · 全台玄學狂歡',
      },
      choices: [
        {
          id: 'ma_r4_death_grip',
          toneLabel: '東方神祕力量',
          label: '微笑對鏡頭舉手致意：「謝謝指教！我手很暖、還會繼續握遍全台灣二十二縣市！」',
          speechText:
            '「一握解千愁！不管藍綠白，今天我把滿滿的祝福握進每位對手手裡，謝謝指教！」',
          hint: '馬英九終極神技！觸發「死亡之握全滅對手」隱藏結局關鍵旗標！',
          statDelta: { unity: 10, momentum: 20, funds: 7, ccpTension: -3, japanPosture: 3 },
          swing: { north: 1.1, central: 1.0, east: 1.5, islands: 2.0, dppShift: -1.2 },
          setFlags: ['death_grip_activated', 'three_principles_zealot'],
          pushReactions: [
            { type: '推', author: 'ptt_xfiles', text: '幹 隔天新聞報賴總統喉嚨沙啞、國昌麥克風斷線！！太神啦！！' },
          ],
          mediaReaction: '「謝謝指教」搭配握手十秒畫面成為 2027 年點擊破千萬第一迷因。',
        },
        {
          id: 'ma_r4_constitution_lecture',
          toneLabel: '憲法教授',
          label: '現場上起五十分鐘《中華民國憲法增修條文》講座，背出所有條號不看稿！',
          speechText:
            '「中華民國憲法增修條文寫得清清楚楚！不讀憲法的人沒有資格討論主權與歷史！」',
          hint: '法界與深藍知識分子鼓掌，年輕脆友邊滑手機邊睡著。',
          statDelta: { unity: 9, momentum: 3, funds: 8, ccpTension: -4, japanPosture: 4 },
          swing: { north: 0.7, islands: 1.6, east: 1.0 },
          pushReactions: [
            { type: '→', author: 'law_student', text: '77歲還能把增修條文背得一字不漏算他強' },
          ],
          mediaReaction: '憲政底氣穩固基本盤。',
        },
      ],
    },
    9: {
      round: 9,
      dateLabel: '2027.05 上',
      boardName: '[個人專場 · 馬英九] 凌晨五點穿「極短紅褲」繞大安森林公園跑十公里直播！',
      title: '【馬前總統專場】酸民嘲笑你太老體力差？你凌晨五點穿招牌極短紅褲開直播海放三十歲記者！',
      situationBrief:
        '五月造勢期間對手暗諷「老人回鍋沒有體力跑全台」，你隔天清晨五點換上經典紅短褲跑完十公里再游兩千公尺，二十幾歲的隨行記者跑到吐！',
      ccpNotice: '大陸健身博主驚呼「77歲配速居然比我還快」。',
      japanNotice: '日本長跑愛好者社群意外湧入大量讚美留言。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '敬佩前總統保持運動習慣，但國家領導人更重要的是帶領台灣跑向正確的時代方向！',
        body: '「跑步體力很好，但兩岸政策不能繼續往回跑！」',
        likesLabel: '2.7萬愛心 · 紅短褲震撼',
      },
      choices: [
        {
          id: 'ma_r9_red_shorts',
          toneLabel: '逆轟高灰',
          label: '喘都不喘直接發起「全台百人晨跑拚經濟」挑戰，邀請三黨候選人一起跑一萬公尺！',
          speechText:
            '「政治人物要先有好體力才能為民服務！來，不服氣的明天早上五點半大安森林公園見，謝謝指教！」',
          hint: '年輕跑團與銀髮族同時圈粉！脆上好感度意外大升！',
          statDelta: { unity: 8, momentum: 16, funds: 5, ccpTension: 0, japanPosture: 6 },
          swing: { north: 1.5, central: 1.0, south: 0.5, specificCounties: { 台北市: 2.0 } },
          pushReactions: [
            { type: '推', author: 'marathon_tw', text: '幹 跑贏隨行25歲記者真的太猛了，運動員推一個' },
          ],
          mediaReaction: '運動用品店同款復古紅短褲突然賣到缺貨。',
        },
        {
          id: 'ma_r9_calligraphy',
          toneLabel: '毛筆春聯',
          label: '跑完步現場親筆揮毫五百張「馬年（提前）駿業宏開、台灣加油」送鄉親！',
          speechText:
            '「文化是台灣最美的軟實力，謝謝指教！」',
          hint: '長輩與傳統書法社團搶翻天，糧草穩增！',
          statDelta: { unity: 9, momentum: 7, funds: 9, ccpTension: -2, japanPosture: 2 },
          swing: { north: 0.8, central: 0.9, east: 1.3 },
          pushReactions: [
            { type: '推', author: 'grandpa_tpe', text: '老馬毛筆字是真的寫得漂亮，我家還貼著' },
          ],
          mediaReaction: '親筆春聯拍賣募得大筆競選經費。',
        },
      ],
    },
    14: {
      round: 14,
      dateLabel: '2027.07 下',
      boardName: '[個人專場 · 馬英九] 「鹿茸不是鹿耳朵裡面的毛」＋「逆轟高灰」金句總復習！',
      title: '【馬前總統專場】脆友剪出十分鐘「馬語錄黑歷史合輯」瘋傳！你竟然親自開台看片自嘲？',
      situationBrief:
        '七月熱浪期間，綠營網軍翻出「鹿茸」、「一個便當吃不夠可以吃兩個」、「逆轟高灰」剪成神曲，點閱破五百萬。',
      ccpNotice: '兩岸網友居然在留言區和諧地一起背出「一個便當吃不夠」。',
      japanNotice: '美日駐台新聞組驚訝台灣政治人物居然敢自己開台看自己的黑歷史鬼畜片。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '賴清德',
        authorRole: '民進黨網路攻勢',
        authorHandle: '@williamlai_tw',
        portraitKey: 'lai',
        headline: '當年薪水倒退、22K 與不食人間煙火的發言，難道大家這麼快就忘記了嗎？',
        body: '「台灣經歷了多年努力才擺脫低薪與過度依賴單一市場的年代！」',
        likesLabel: '4.4萬愛心 · 回憶殺對決',
      },
      choices: [
        {
          id: 'ma_r14_deer_meme',
          toneLabel: '自嘲滿級',
          label: '戴上鹿角頭箍吃兩個便當自拍：「沒錯我錯把鹿茸講錯！但民進黨現在電價漲到便當一個要一百五！」',
          speechText:
            '「我當年口誤我都認錯反省！反觀現在便當漲兩倍、電價跳兩倍、房價翻三倍，執政黨何時跟人民道歉？謝謝指教！」',
          hint: '神級反殺！把十年黑歷史直接翻轉成攻擊當下物價的核彈！',
          statDelta: { unity: 7, momentum: 17, funds: 6, ccpTension: 0, japanPosture: 3 },
          swing: { north: 1.3, central: 1.3, south: 0.8, dppShift: -1.2 },
          pushReactions: [
            { type: '推', author: 'ptt_bento', text: '靠北 戴鹿角吃兩個便當反酸物價這招太絕了，真的沒得黑' },
          ],
          mediaReaction: '「馬式自嘲吃兩個便當」衝上台灣熱搜榜第一名。',
        },
        {
          id: 'ma_r14_visa_record',
          toneLabel: '政績反擊',
          label: '攤開「164 國免簽證＋觀光客破千萬＋低通膨」成績單正面對決！',
          speechText:
            '「比較過去與現在的免簽國數、物價穩定度跟兩岸和平紅利，答案一目了然！」',
          hint: '旅遊業與中產懷舊選民回流。',
          statDelta: { unity: 7, momentum: 7, funds: 8, ccpTension: -4, japanPosture: 5 },
          swing: { north: 1.0, central: 0.9, east: 1.0 },
          pushReactions: [
            { type: '推', author: 'travel_agent', text: '講免簽跟觀光客數量旅行社真的最有感' },
          ],
          mediaReaction: '執政成績比較掀起長輩討論熱潮。',
        },
      ],
    },
    20: {
      round: 20,
      dateLabel: '2027.10 下',
      boardName: '[個人專場 · 馬英九] 釣魚台保釣老兵＋九二共識終極考驗',
      title: '【馬前總統專場】外媒逼問九二共識與年輕時「保釣運動」歷史，你當場秀出 1971 年保釣照片！',
      situationBrief:
        '十月底外交問答，美日記者質疑你「到底站北京還是站華府東京」，你緩緩拿出大學時期赴美抗議的保釣歷史照片，讓全場瞬間安靜。',
      ccpNotice: '北京媒體重新轉發馬英九早年保釣事蹟。',
      japanNotice: '美日駐台人員高度重視你如何同時詮釋「東海和平倡議」與釣魚台立場。',
      rivalPost: {
        platform: 'Threads 脆',
        authorName: '蕭美琴',
        authorRole: '現任副總統 · 民進黨',
        authorHandle: '@bikhim_tw',
        portraitKey: 'hsiao',
        headline: '面對北京步步進逼，九二共識早已在習近平定義下沒有各表空間！',
        body: '「台海安全靠的是與美日民主同盟並肩，不是活在 1992 年的模糊名詞裡！」',
        likesLabel: '3.9萬愛心 · 路線終極辯論',
      },
      choices: [
        {
          id: 'ma_r20_east_china_sea',
          toneLabel: '東海和平倡議',
          label: '重申「主權在我、擱置爭議、和平互惠、共同開發」，兼顧保釣與美日台漁業協定！',
          speechText:
            '「我年輕時保釣、當總統時簽下歷史性的台日漁業協議！這才是既保主權又讓漁民真正在釣魚台捕魚的智慧！」',
          hint: '漁民大讚且美日外交界給予高度尊敬！台海壓力同時下降！',
          statDelta: { unity: 8, momentum: 9, funds: 7, ccpTension: -8, japanPosture: 12 },
          swing: { north: 1.2, east: 1.5, central: 0.9, specificCounties: { 宜蘭縣: 2.0, 金門縣: 1.8 } },
          setFlags: ['diaoyu_compromise'],
          pushReactions: [
            { type: '推', author: 'fishery_assoc', text: '台日漁業協議確實是馬任內簽下最實用的協議，漁民沒話說' },
          ],
          mediaReaction: '東京與華府智庫罕見一致正面評價這番外交演說。',
        },
        {
          id: 'ma_r20_92_orthodox',
          toneLabel: '九二一中各表',
          label: '堅定宣告「九二共識一中各表就是中華民國！一個字都不改！」順便再握一次記者手！',
          speechText:
            '「一中就是中華民國！兩岸和平靠九二共識，不服氣的人請去讀憲法，謝謝指教！」',
          hint: '深藍鐵票與金馬滿格，同時發動第二次握手因果律，本島美日略降！',
          statDelta: { unity: 12, momentum: 11, funds: 8, ccpTension: -10, japanPosture: -8 },
          swing: { east: 1.8, islands: 3.0, north: -0.5, south: -0.8 },
          setFlags: ['death_grip_activated'],
          pushReactions: [
            { type: '推', author: 'kinmen_old', text: '九二共識唯一信仰！這才是穩健兩岸線' },
          ],
          mediaReaction: '深藍極度滿意，記者則默默把雙手插進口袋。',
        },
      ],
    },
  },
};
