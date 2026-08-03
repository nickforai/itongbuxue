/* 学习乐园 · 各科内容数据 */
(function () {
  'use strict';

  /* ---------- 语文：三年级必背古诗 14 首 ---------- */
  var Poems = {
    1: [
      { id: 'g1_hua', title: '画', author: '唐·王维', lines: ['远看山有色', '近听水无声', '春去花还在', '人来鸟不惊'] },
      { id: 'g1_jiangnan', title: '江南', author: '汉乐府', lines: ['江南可采莲', '莲叶何田田', '鱼戏莲叶间', '鱼戏莲叶东', '鱼戏莲叶西', '鱼戏莲叶南', '鱼戏莲叶北'] },
      { id: 'g1_minnong2', title: '悯农（其二）', author: '唐·李绅', lines: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'] },
      { id: 'g1_gulangyuexing', title: '古朗月行（节选）', author: '唐·李白', lines: ['小时不识月', '呼作白玉盘', '又疑瑶台镜', '飞在青云端'] },
      { id: 'g1_feng', title: '风', author: '唐·李峤', lines: ['解落三秋叶', '能开二月花', '过江千尺浪', '入竹万竿斜'] },
      { id: 'g1_jingyesi', title: '静夜思', author: '唐·李白', lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
      { id: 'g1_chunxiao', title: '春晓', author: '唐·孟浩然', lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
      { id: 'g1_zengwanglun', title: '赠汪伦', author: '唐·李白', lines: ['李白乘舟将欲行', '忽闻岸上踏歌声', '桃花潭水深千尺', '不及汪伦送我情'] },
      { id: 'g1_chishang', title: '池上', author: '唐·白居易', lines: ['小娃撑小艇', '偷采白莲回', '不解藏踪迹', '浮萍一道开'] },
      { id: 'g1_xiaochi', title: '小池', author: '宋·杨万里', lines: ['泉眼无声惜细流', '树阴照水爱晴柔', '小荷才露尖尖角', '早有蜻蜓立上头'] }
    ],
    2: [
      { id: 'g2_denglouguanque', title: '登鹳雀楼', author: '唐·王之涣', lines: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'] },
      { id: 'g2_wanglushanpubu', title: '望庐山瀑布', author: '唐·李白', lines: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'] },
      { id: 'g2_yesusi', title: '夜宿山寺', author: '唐·李白', lines: ['危楼高百尺', '手可摘星辰', '不敢高声语', '恐惊天上人'] },
      { id: 'g2_chilege', title: '敕勒歌', author: '北朝民歌', lines: ['敕勒川', '阴山下', '天似穹庐', '笼盖四野', '天苍苍', '野茫茫', '风吹草低见牛羊'] },
      { id: 'g2_meihua', title: '梅花', author: '宋·王安石', lines: ['墙角数枝梅', '凌寒独自开', '遥知不是雪', '为有暗香来'] },
      { id: 'g2_xiaoerchuidao', title: '小儿垂钓', author: '唐·胡令能', lines: ['蓬头稚子学垂纶', '侧坐莓苔草映身', '路人借问遥招手', '怕得鱼惊不应人'] },
      { id: 'g2_cunju', title: '村居', author: '清·高鼎', lines: ['草长莺飞二月天', '拂堤杨柳醉春烟', '儿童散学归来早', '忙趁东风放纸鸢'] },
      { id: 'g2_yongliu', title: '咏柳', author: '唐·贺知章', lines: ['碧玉妆成一树高', '万条垂下绿丝绦', '不知细叶谁裁出', '二月春风似剪刀'] },
      { id: 'g2_xiaochujingcifu', title: '晓出净慈寺送林子方', author: '宋·杨万里', lines: ['毕竟西湖六月中', '风光不与四时同', '接天莲叶无穷碧', '映日荷花别样红'] },
      { id: 'g2_jueju', title: '绝句', author: '唐·杜甫', lines: ['两个黄鹂鸣翠柳', '一行白鹭上青天', '窗含西岭千秋雪', '门泊东吴万里船'] },
      { id: 'g2_minnong1', title: '悯农（其一）', author: '唐·李绅', lines: ['春种一粒粟', '秋收万颗子', '四海无闲田', '农夫犹饿死'] },
      { id: 'g2_zhouyeshushuojian', title: '舟夜书所见', author: '清·查慎行', lines: ['月黑见渔灯', '孤光一点萤', '微微风簇浪', '散作满河星'] }
    ],
    3: [
      { id: 'suojian', title: '所见', author: '清·袁枚', lines: ['牧童骑黄牛', '歌声振林樾', '意欲捕鸣蝉', '忽然闭口立'] },
      { id: 'shanxing', title: '山行', author: '唐·杜牧', lines: ['远上寒山石径斜', '白云生处有人家', '停车坐爱枫林晚', '霜叶红于二月花'] },
      { id: 'zengliujingwen', title: '赠刘景文', author: '宋·苏轼', lines: ['荷尽已无擎雨盖', '菊残犹有傲霜枝', '一年好景君须记', '最是橙黄橘绿时'] },
      { id: 'yeshushuojian', title: '夜书所见', author: '宋·叶绍翁', lines: ['萧萧梧叶送寒声', '江上秋风动客情', '知有儿童挑促织', '夜深篱落一灯明'] },
      { id: 'wangtianmenshan', title: '望天门山', author: '唐·李白', lines: ['天门中断楚江开', '碧水东流至此回', '两岸青山相对出', '孤帆一片日边来'] },
      { id: 'yinhuhushangchuqinghouyu', title: '饮湖上初晴后雨', author: '宋·苏轼', lines: ['水光潋滟晴方好', '山色空蒙雨亦奇', '欲把西湖比西子', '淡妆浓抹总相宜'] },
      { id: 'wangdongting', title: '望洞庭', author: '唐·刘禹锡', lines: ['湖光秋月两相和', '潭面无风镜未磨', '遥望洞庭山水翠', '白银盘里一青螺'] },
      { id: 'zaofabaidicheng', title: '早发白帝城', author: '唐·李白', lines: ['朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山'] },
      { id: 'cailianqu', title: '采莲曲', author: '唐·王昌龄', lines: ['荷叶罗裙一色裁', '芙蓉向脸两边开', '乱入池中看不见', '闻歌始觉有人来'] },
      { id: 'jueju', title: '绝句', author: '唐·杜甫', lines: ['迟日江山丽', '春风花草香', '泥融飞燕子', '沙暖睡鸳鸯'] },
      { id: 'huichongchunjiangwanjing', title: '惠崇春江晚景', author: '宋·苏轼', lines: ['竹外桃花三两枝', '春江水暖鸭先知', '蒌蒿满地芦芽短', '正是河豚欲上时'] },
      { id: 'sanqudaozhong', title: '三衢道中', author: '宋·曾几', lines: ['梅子黄时日日晴', '小溪泛尽却山行', '绿阴不减来时路', '添得黄鹂四五声'] },
      { id: 'yuanri', title: '元日', author: '宋·王安石', lines: ['爆竹声中一岁除', '春风送暖入屠苏', '千门万户曈曈日', '总把新桃换旧符'] },
      { id: 'qingming', title: '清明', author: '唐·杜牧', lines: ['清明时节雨纷纷', '路上行人欲断魂', '借问酒家何处有', '牧童遥指杏花村'] },
      { id: 'jiuyuejiuyiriyishandongxiongdi', title: '九月九日忆山东兄弟', author: '唐·王维', lines: ['独在异乡为异客', '每逢佳节倍思亲', '遥知兄弟登高处', '遍插茱萸少一人'] },
      { id: 'yijiangnan', title: '忆江南', author: '唐·白居易', lines: ['江南好', '风景旧曾谙', '日出江花红胜火', '春来江水绿如蓝', '能不忆江南'] },
      { id: 'chuzhouxijian', title: '滁州西涧', author: '唐·韦应物', lines: ['独怜幽草涧边生', '上有黄鹂深树鸣', '春潮带雨晚来急', '野渡无人舟自横'] },
      { id: 'dalinsitaohua', title: '大林寺桃花', author: '唐·白居易', lines: ['人间四月芳菲尽', '山寺桃花始盛开', '长恨春归无觅处', '不知转入此中来'] }
    ],
    4: [
      { id: 'g4_mujiangyin', title: '暮江吟', author: '唐·白居易', lines: ['一道残阳铺水中', '半江瑟瑟半江红', '可怜九月初三夜', '露似真珠月似弓'] },
      { id: 'g4_tixibilinbi', title: '题西林壁', author: '宋·苏轼', lines: ['横看成岭侧成峰', '远近高低各不同', '不识庐山真面目', '只缘身在此山中'] },
      { id: 'g4_xuemei', title: '雪梅', author: '宋·卢钺', lines: ['梅雪争春未肯降', '骚人阁笔费评章', '梅须逊雪三分白', '雪却输梅一段香'] },
      { id: 'g4_change', title: '嫦娥', author: '唐·李商隐', lines: ['云母屏风烛影深', '长河渐落晓星沉', '嫦娥应悔偷灵药', '碧海青天夜夜心'] },
      { id: 'g4_chusai', title: '出塞', author: '唐·王昌龄', lines: ['秦时明月汉时关', '万里长征人未还', '但使龙城飞将在', '不教胡马度阴山'] },
      { id: 'g4_liangzhouci', title: '凉州词', author: '唐·王翰', lines: ['葡萄美酒夜光杯', '欲饮琵琶马上催', '醉卧沙场君莫笑', '古来征战几人回'] },
      { id: 'g4_xiarijueju', title: '夏日绝句', author: '宋·李清照', lines: ['生当作人杰', '死亦为鬼雄', '至今思项羽', '不肯过江东'] },
      { id: 'g4_suxinshixugongdian', title: '宿新市徐公店', author: '宋·杨万里', lines: ['篱落疏疏一径深', '树头新绿未成阴', '儿童急走追黄蝶', '飞入菜花无处寻'] },
      { id: 'g4_sishitianyuan25', title: '四时田园杂兴（其二十五）', author: '宋·范成大', lines: ['梅子金黄杏子肥', '麦花雪白菜花稀', '日长篱落无人过', '惟有蜻蜓蛱蝶飞'] },
      { id: 'g4_qingpingle', title: '清平乐·村居', author: '宋·辛弃疾', lines: ['茅檐低小', '溪上青青草', '醉里吴音相媚好', '白发谁家翁媪', '大儿锄豆溪东', '中儿正织鸡笼', '最喜小儿亡赖', '溪头卧剥莲蓬'] },
      { id: 'g4_furonglou', title: '芙蓉楼送辛渐', author: '唐·王昌龄', lines: ['寒雨连江夜入吴', '平明送客楚山孤', '洛阳亲友如相问', '一片冰心在玉壶'] },
      { id: 'g4_saixiaqu', title: '塞下曲', author: '唐·卢纶', lines: ['月黑雁飞高', '单于夜遁逃', '欲将轻骑逐', '大雪满弓刀'] },
      { id: 'g4_moyan', title: '墨梅', author: '元·王冕', lines: ['我家洗砚池头树', '朵朵花开淡墨痕', '不要人夸好颜色', '只留清气满乾坤'] }
    ],
    5: [
      { id: 'g5_chan', title: '蝉', author: '唐·虞世南', lines: ['垂緌饮清露', '流响出疏桐', '居高声自远', '非是藉秋风'] },
      { id: 'g5_qiqiao', title: '乞巧', author: '唐·林杰', lines: ['七夕今宵看碧霄', '牵牛织女渡河桥', '家家乞巧望秋月', '穿尽红丝几万条'] },
      { id: 'g5_shier', title: '示儿', author: '宋·陆游', lines: ['死去元知万事空', '但悲不见九州同', '王师北定中原日', '家祭无忘告乃翁'] },
      { id: 'g5_tilinanandi', title: '题临安邸', author: '宋·林升', lines: ['山外青山楼外楼', '西湖歌舞几时休', '暖风熏得游人醉', '直把杭州作汴州'] },
      { id: 'g5_yihaizashi', title: '己亥杂诗', author: '清·龚自珍', lines: ['九州生气恃风雷', '万马齐喑究可哀', '我劝天公重抖擞', '不拘一格降人才'] },
      { id: 'g5_shanjvqiuming', title: '山居秋暝', author: '唐·王维', lines: ['空山新雨后', '天气晚来秋', '明月松间照', '清泉石上流', '竹喧归浣女', '莲动下渔舟', '随意春芳歇', '王孙自可留'] },
      { id: 'g5_fengqiaoyebo', title: '枫桥夜泊', author: '唐·张继', lines: ['月落乌啼霜满天', '江枫渔火对愁眠', '姑苏城外寒山寺', '夜半钟声到客船'] },
      { id: 'g5_changxiangsi', title: '长相思', author: '清·纳兰性德', lines: ['山一程', '水一程', '身向榆关那畔行', '夜深千帐灯', '风一更', '雪一更', '聒碎乡心梦不成', '故园无此声'] },
      { id: 'g5_yugezi', title: '渔歌子', author: '唐·张志和', lines: ['西塞山前白鹭飞', '桃花流水鳜鱼肥', '青箬笠', '绿蓑衣', '斜风细雨不须归'] },
      { id: 'g5_sishitianyuan31', title: '四时田园杂兴（其三十一）', author: '宋·范成大', lines: ['昼出耘田夜绩麻', '村庄儿女各当家', '童孙未解供耕织', '也傍桑阴学种瓜'] },
      { id: 'g5_zhinongbing', title: '稚子弄冰', author: '宋·杨万里', lines: ['稚子金盆脱晓冰', '彩丝穿取当银钲', '敲成玉磬穿林响', '忽作玻璃碎地声'] },
      { id: 'g5_cunwan', title: '村晚', author: '宋·雷震', lines: ['草满池塘水满陂', '山衔落日浸寒漪', '牧童归去横牛背', '短笛无腔信口吹'] },
      { id: 'g5_congjunxing', title: '从军行', author: '唐·王昌龄', lines: ['青海长云暗雪山', '孤城遥望玉门关', '黄沙百战穿金甲', '不破楼兰终不还'] },
      { id: 'g5_qiuyejiangxiaochuyingliangyougan', title: '秋夜将晓出篱门迎凉有感', author: '宋·陆游', lines: ['三万里河东入海', '五千仞岳上摩天', '遗民泪尽胡尘里', '南望王师又一年'] },
      { id: 'g5_wenguanjunshouhenanhebei', title: '闻官军收河南河北', author: '唐·杜甫', lines: ['剑外忽传收蓟北', '初闻涕泪满衣裳', '却看妻子愁何在', '漫卷诗书喜欲狂', '白日放歌须纵酒', '青春作伴好还乡', '即从巴峡穿巫峡', '便下襄阳向洛阳'] },
      { id: 'g5_niaomingjian', title: '鸟鸣涧', author: '唐·王维', lines: ['人闲桂花落', '夜静春山空', '月出惊山鸟', '时鸣春涧中'] }
    ],
    6: [
      { id: 'g6_sujianjiang', title: '宿建德江', author: '唐·孟浩然', lines: ['移舟泊烟渚', '日暮客愁新', '野旷天低树', '江清月近人'] },
      { id: 'g6_liuyueershierriwanghulouzuishu', title: '六月二十七日望湖楼醉书', author: '宋·苏轼', lines: ['黑云翻墨未遮山', '白雨跳珠乱入船', '卷地风来忽吹散', '望湖楼下水如天'] },
      { id: 'g6_xijiangyue', title: '西江月·夜行黄沙道中', author: '宋·辛弃疾', lines: ['明月别枝惊鹊', '清风半夜鸣蝉', '稻花香里说丰年', '听取蛙声一片', '七八个星天外', '两三点雨山前', '旧时茅店社林边', '路转溪桥忽见'] },
      { id: 'g6_langtaosha', title: '浪淘沙（其一）', author: '唐·刘禹锡', lines: ['九曲黄河万里沙', '浪淘风簸自天涯', '如今直上银河去', '同到牵牛织女家'] },
      { id: 'g6_jiangnanchun', title: '江南春', author: '唐·杜牧', lines: ['千里莺啼绿映红', '水村山郭酒旗风', '南朝四百八十寺', '多少楼台烟雨中'] },
      { id: 'g6_shuhuyinxianshengbi', title: '书湖阴先生壁', author: '宋·王安石', lines: ['茅檐长扫净无苔', '花木成畦手自栽', '一水护田将绿绕', '两山排闼送青来'] },
      { id: 'g6_qilvchangzheng', title: '七律·长征', author: '毛泽东', lines: ['红军不怕远征难', '万水千山只等闲', '五岭逶迤腾细浪', '乌蒙磅礴走泥丸', '金沙水拍云崖暖', '大渡桥横铁索寒', '更喜岷山千里雪', '三军过后尽开颜'] },
      { id: 'g6_hanshi', title: '寒食', author: '唐·韩翃', lines: ['春城无处不飞花', '寒食东风御柳斜', '日暮汉宫传蜡烛', '轻烟散入五侯家'] },
      { id: 'g6_tiaotiaoqianniuxing', title: '迢迢牵牛星', author: '《古诗十九首》', lines: ['迢迢牵牛星', '皎皎河汉女', '纤纤擢素手', '札札弄机杼', '终日不成章', '泣涕零如雨', '河汉清且浅', '相去复几许', '盈盈一水间', '脉脉不得语'] },
      { id: 'g6_shiwuyewangyue', title: '十五夜望月', author: '唐·王建', lines: ['中庭地白树栖鸦', '冷露无声湿桂花', '今夜月明人尽望', '不知秋思落谁家'] },
      { id: 'g6_zhushi', title: '竹石', author: '清·郑燮', lines: ['咬定青山不放松', '立根原在破岩中', '千磨万击还坚劲', '任尔东西南北风'] },
      { id: 'g6_shihuiyin', title: '石灰吟', author: '明·于谦', lines: ['千锤万凿出深山', '烈火焚烧若等闲', '粉骨碎身浑不怕', '要留清白在人间'] },
      { id: 'g6_mashi', title: '马诗', author: '唐·李贺', lines: ['大漠沙如雪', '燕山月似钩', '何当金络脑', '快走踏清秋'] },
      { id: 'g6_changgexing', title: '长歌行', author: '汉乐府', lines: ['青青园中葵', '朝露待日晞', '阳春布德泽', '万物生光辉', '常恐秋节至', '焜黄华叶衰', '百川东到海', '何时复西归', '少壮不努力', '老大徒伤悲'] },
      { id: 'g6_chunyexiyu', title: '春夜喜雨', author: '唐·杜甫', lines: ['好雨知时节', '当春乃发生', '随风潜入夜', '润物细无声', '野径云俱黑', '江船火独明', '晓看红湿处', '花重锦官城'] }
    ]
  };

  function poemText(p) {
    return p.title + '，' + p.author.replace('·', '朝 ') + '。' + p.lines.join('，') + '。';
  }

  /* ---------- 英语：PEP 三年级核心词汇 ---------- */
  var WordBank = {
    topics: [
      {
        name: '颜色', emoji: '🎨', words: [
          { zh: '红色', en: 'red', emoji: '🔴' }, { zh: '黄色', en: 'yellow', emoji: '🟡' },
          { zh: '绿色', en: 'green', emoji: '🟢' }, { zh: '蓝色', en: 'blue', emoji: '🔵' },
          { zh: '黑色', en: 'black', emoji: '⚫' }, { zh: '白色', en: 'white', emoji: '⚪' },
          { zh: '棕色', en: 'brown', emoji: '🟤' }, { zh: '橙色', en: 'orange', emoji: '🟠' }
        ]
      },
      {
        name: '动物', emoji: '🐾', words: [
          { zh: '猫', en: 'cat', emoji: '🐱' }, { zh: '狗', en: 'dog', emoji: '🐶' },
          { zh: '鸭子', en: 'duck', emoji: '🦆' }, { zh: '猪', en: 'pig', emoji: '🐷' },
          { zh: '熊', en: 'bear', emoji: '🐻' }, { zh: '小鸟', en: 'bird', emoji: '🐦' },
          { zh: '熊猫', en: 'panda', emoji: '🐼' }, { zh: '猴子', en: 'monkey', emoji: '🐵' },
          { zh: '老虎', en: 'tiger', emoji: '🐯' }, { zh: '大象', en: 'elephant', emoji: '🐘' },
          { zh: '兔子', en: 'rabbit', emoji: '🐰' }, { zh: '鱼', en: 'fish', emoji: '🐟' }
        ]
      },
      {
        name: '文具', emoji: '✏️', words: [
          { zh: '钢笔', en: 'pen', emoji: '🖊️' }, { zh: '铅笔', en: 'pencil', emoji: '✏️' },
          { zh: '尺子', en: 'ruler', emoji: '📏' }, { zh: '橡皮', en: 'eraser', emoji: '🧽' },
          { zh: '蜡笔', en: 'crayon', emoji: '🖍️' }, { zh: '书包', en: 'bag', emoji: '🎒' },
          { zh: '书', en: 'book', emoji: '📚' }
        ]
      },
      {
        name: '食物', emoji: '🍰', words: [
          { zh: '蛋糕', en: 'cake', emoji: '🎂' }, { zh: '面包', en: 'bread', emoji: '🍞' },
          { zh: '果汁', en: 'juice', emoji: '🧃' }, { zh: '牛奶', en: 'milk', emoji: '🥛' },
          { zh: '鸡蛋', en: 'egg', emoji: '🥚' }, { zh: '米饭', en: 'rice', emoji: '🍚' },
          { zh: '水', en: 'water', emoji: '💧' }
        ]
      },
      {
        name: '数字', emoji: '🔢', words: [
          { zh: '一', en: 'one', emoji: '1️⃣' }, { zh: '二', en: 'two', emoji: '2️⃣' },
          { zh: '三', en: 'three', emoji: '3️⃣' }, { zh: '四', en: 'four', emoji: '4️⃣' },
          { zh: '五', en: 'five', emoji: '5️⃣' }, { zh: '六', en: 'six', emoji: '6️⃣' },
          { zh: '七', en: 'seven', emoji: '7️⃣' }, { zh: '八', en: 'eight', emoji: '8️⃣' },
          { zh: '九', en: 'nine', emoji: '9️⃣' }, { zh: '十', en: 'ten', emoji: '🔟' }
        ]
      },
      {
        name: '家庭', emoji: '👨‍👩‍👧', words: [
          { zh: '爸爸', en: 'father', emoji: '👨' }, { zh: '妈妈', en: 'mother', emoji: '👩' },
          { zh: '兄弟', en: 'brother', emoji: '👦' }, { zh: '姐妹', en: 'sister', emoji: '👧' },
          { zh: '爷爷', en: 'grandpa', emoji: '👴' }, { zh: '奶奶', en: 'grandma', emoji: '👵' },
          { zh: '家庭', en: 'family', emoji: '👨‍👩‍👧' }
        ]
      },
      {
        name: '身体', emoji: '🧍', words: [
          { zh: '眼睛', en: 'eye', emoji: '👁️' }, { zh: '耳朵', en: 'ear', emoji: '👂' },
          { zh: '鼻子', en: 'nose', emoji: '👃' }, { zh: '嘴巴', en: 'mouth', emoji: '👄' },
          { zh: '脸', en: 'face', emoji: '😊' }, { zh: '手', en: 'hand', emoji: '✋' },
          { zh: '头', en: 'head', emoji: '🧑' }, { zh: '身体', en: 'body', emoji: '🧍' }
        ]
      },
      {
        name: '水果', emoji: '🍎', words: [
          { zh: '苹果', en: 'apple', emoji: '🍎' }, { zh: '梨', en: 'pear', emoji: '🍐' },
          { zh: '橙子', en: 'orange', emoji: '🍊' }, { zh: '香蕉', en: 'banana', emoji: '🍌' },
          { zh: '西瓜', en: 'watermelon', emoji: '🍉' }, { zh: '草莓', en: 'strawberry', emoji: '🍓' },
          { zh: '葡萄', en: 'grape', emoji: '🍇' }
        ]
      }
    ]
  };

  var allWords = [];
  WordBank.topics.forEach(function (t) {
    t.words.forEach(function (w) {
      allWords.push({ topic: t.name, topicEmoji: t.emoji, zh: w.zh, en: w.en, emoji: w.emoji });
    });
  });
  WordBank.all = allWords;

  /* ---------- 科学：科普主题 + 小问答 ---------- */
  var Science = {
    topics: [
      {
        id: 'water', title: '水的三态', emoji: '💧',
        content: '水在常温下是液体。温度降到 0℃ 以下，水会结冰，变成固体；加热到 100℃，水会沸腾，变成水蒸气。冰会融化成水，水会蒸发成水蒸气，这些变化还能变回来哦！',
        questions: [
          { q: '水在 0℃ 以下会变成什么？', options: ['冰', '水蒸气', '云', '雨'], answer: 0 },
          { q: '水加热到 100℃ 会怎么样？', options: ['结冰', '沸腾变成水蒸气', '变成固体', '没有变化'], answer: 1 },
          { q: '把冰放在温暖的房间里会怎样？', options: ['直接变成水蒸气', '融化成水', '结成更厚的冰', '变成雪'], answer: 1 }
        ]
      },
      {
        id: 'air', title: '空气在哪里', emoji: '💨',
        content: '空气看不见、摸不着，但它真的存在！空气占据空间、有质量，还会流动。吹气球、把空杯子倒扣压进水里、风车转起来，都是空气存在的证据。',
        questions: [
          { q: '风是什么？', options: ['云在飘', '雨点下落', '空气在流动', '太阳光照'], answer: 2 },
          { q: '空杯子倒扣压进水里，为什么进不去多少水？', options: ['杯子太硬', '杯里有空气占据空间', '水太冷', '杯子太轻'], answer: 1 },
          { q: '空气有质量吗？', options: ['有，只是很轻', '没有', '只有热空气有', '说不准'], answer: 0 }
        ]
      },
      {
        id: 'weather', title: '天气与气温', emoji: '🌡️',
        content: '天气包括气温、云量、降水量和风力。气温用温度计测量，单位是摄氏度（℃）。晴天、阴天、下雨、刮风，都是我们每天能观察到的天气现象。',
        questions: [
          { q: '测量气温用什么工具？', options: ['尺子', '温度计', '天平', '秒表'], answer: 1 },
          { q: '气温的单位是什么？', options: ['米', '克', '摄氏度（℃）', '分钟'], answer: 2 },
          { q: '下面哪个是天气现象？', options: ['石头', '树叶', '河水', '下雨'], answer: 3 }
        ]
      },
      {
        id: 'motion', title: '物体的运动', emoji: '⚽',
        content: '物体位置变了，说明它在运动。苹果从树上掉下来是直线运动，过山车是曲线运动。比较快慢：相同距离比时间，时间少就快；相同时间比距离，距离远就快。',
        questions: [
          { q: '下列哪个是直线运动？', options: ['过山车', '苹果从树上掉下来', '风车旋转', '青蛙跳'], answer: 1 },
          { q: '相同距离，怎样算更快？', options: ['用的时间少更快', '用的时间多更快', '都一样', '没法比较'], answer: 0 },
          { q: '判断物体是否运动，要看什么变了？', options: ['颜色', '大小', '位置', '温度'], answer: 2 }
        ]
      },
      {
        id: 'silkworm', title: '蚕的一生', emoji: '🐛',
        content: '蚕宝宝从蚕卵里孵出来，吃桑叶慢慢长大，蜕皮几次后变成蚕蛹，最后变成会飞一点的蚕蛾。蚕的一生经历了：卵 → 幼虫 → 蛹 → 成虫。',
        questions: [
          { q: '蚕宝宝最爱吃什么？', options: ['肉', '桑叶', '米饭', '泥土'], answer: 1 },
          { q: '蚕的一生要经历几个阶段？', options: ['卵→幼虫→蛹→成虫', '卵→鱼→鸟', '只有幼虫', '幼虫→成虫两步'], answer: 0 },
          { q: '蚕最后会变成什么？', options: ['蝴蝶', '小鸟', '蚕蛾', '蜜蜂'], answer: 2 }
        ]
      },
      {
        id: 'moon', title: '月亮的变化', emoji: '🌙',
        content: '月球是地球的卫星，它自己不发光，我们看到的月光是它反射的太阳光。一个月里，月亮从新月变成上弦月，再变成满月，又慢慢变回新月，这就是月相变化。',
        questions: [
          { q: '月亮会自己发光吗？', options: ['会', '不会，它反射太阳光', '只有满月会', '说不准'], answer: 1 },
          { q: '月球是地球的什么？', options: ['行星', '恒星', '卫星', '太阳'], answer: 2 },
          { q: '一个月中，月亮的形状会怎样？', options: ['一直不变', '会慢慢变化', '只会变圆', '只在白天变'], answer: 1 }
        ]
      }
    ]
  };

  window.POEMS = Poems;
  window.poemText = poemText;
  window.WordBank = WordBank;
  window.Science = Science;
})();
