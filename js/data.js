/* 学习乐园 · 各科内容数据 */
(function () {
  'use strict';

  /* ---------- 语文：三年级必背古诗 14 首 ---------- */
  var Poems = [
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
  ];

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

  window.Poems = Poems;
  window.poemText = poemText;
  window.WordBank = WordBank;
  window.Science = Science;
})();
