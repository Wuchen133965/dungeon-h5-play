'use strict';
// Resident commissions: each entry is a saved, one-time story rather than a repeatable dialogue payout.
// The builder runs after town-quests.js has defined its objective helpers.
function buildSideQuestExpansion() {
  const colours = { guild: '#ed9685', mentor: '#82e68c', smith: '#ffb060', quartermaster: '#91c0e6', cook: '#f3c17a', archivist: '#c4a4ef' };
  const job = (id, name, reward, icon, owner, desc, steps) => ({ id: `side_${id}`, name, reward, icon,
    owner, family: owner, col: colours[owner], desc, repeatable: false, steps });
  return [
    // 莉娅：一份公会账册，也是一群人的日常。
    job('late_bell', '钟声之后的轮班', 25, 'hourglass', 'guild', '查明告示板上的轮班冲突，让值夜的人也能准时吃饭', [
      questDialogue('request', 'guild', '向莉娅询问推迟的换班钟', [
        ['guild', '钟敲过了，第三班却没人来换。我不想再用一句“辛苦大家”糊弄过去。'],
        ['hero', '是表格出了问题？'],
        ['guild', '去看看告示板的时刻，再找雷恩核对。他那份也许还停在旧时间。'],
      ]),
      questInspect('schedule', 'board', '检查公会告示板的两份轮班时刻', [
        ['narrator', '一张表按钟声换班，另一张写着“热汤送达后”。两份都盖着有效印记。'],
        ['hero', '不是谁迟到，是两边等着不同的信号。'],
        ['narrator', '你记下相互冲突的两条说明，准备交给负责排班的人。'],
      ], '公会告示板 · 轮班核对'),
      questDialogue('reconcile', 'quartermaster', '请雷恩核对轮班时刻', [
        ['quartermaster', '我改了表，却没把食堂那张通知收回来。责任在我。'],
        ['hero', '莉娅希望换班不再依赖送汤时间。'],
        ['quartermaster', '同意。我跟你去公会，把米洛也叫上，只留一套标准。'],
      ]),
      questDialogue('settle', 'guild', '到公会参加轮班时间核对', [
        ['narrator', '莉娅请雷恩和米洛在公会门廊坐下，桌上放着两份旧表。'],
        ['guild', '换班认钟声，送饭单独安排。不能让吃饭和休息互相等。'],
        ['cook', '我把热汤送到交班后。换下的人不用端着碗站岗。'],
        ['quartermaster', '旧表我亲自撤下。这次不再把改动只写进自己那一份。'],
        ['guild', '谢谢你把矛盾带回来，而不是只替我们催一遍人。'],
      ], '公会门廊 · 轮班会谈'),
    ]),
    job('unsigned_complaint', '没有落款的抱怨', 20, 'book', 'guild', '听取食堂的真实困难，帮莉娅回复一封匿名意见', [
      questDialogue('complaint', 'guild', '向莉娅了解匿名意见', [
        ['guild', '有人抱怨食堂偏心，总给冒险者多盛一勺。没有署名，我也不能装作没看见。'],
        ['hero', '你想知道是谁写的？'],
        ['guild', '先别追人。帮我问米洛，锅里到底够不够。解决事，比找到一个可责怪的人有用。'],
      ]),
      questDialogue('kitchen', 'cook', '向米洛了解食堂分餐方式', [
        ['cook', '伤者拿的是稀汤，不是多一份肉。有人站在窗口另一头，只看见碗更满。'],
        ['hero', '那为什么没有写出来？'],
        ['cook', '怕让伤者觉得被所有人盯着。可以说明分餐原则，不把人的伤口贴上墙。'],
      ]),
      questDialogue('reply', 'guild', '向莉娅转达分餐原则', [
        ['guild', '我会回复那封意见：公开规则，保留每个人的隐私。'],
        ['hero', '不用查出写信的人了？'],
        ['guild', '不用。能放心说出不满，才有人肯留在这个镇子。'],
      ]),
    ]),
    job('trader_seats', '给商人留一张椅子', 30, 'coin', 'guild', '拜访晨星边境商店并实际消费，为流动商人核对补给需求', [
      questDialogue('invitation', 'guild', '听莉娅说明商队协商计划', [
        ['guild', '我们讨论补给时，桌上一直没有商人的位置。难怪每次说好数量，送来的却不同。'],
        ['hero', '先问地牢里的旅行商人？'],
        ['guild', '对。到晨星边境的商店实际交易，带回你用得上的补给经验，不要只问一张空价目表。'],
      ]),
      questEvent('shop', 'visit', 1, '进入第 1 幕晨星边境的旅行商店', { act: 1, type: 'shop' }),
      questEvent('purchase', 'goldspend', 100, '在第 1 幕商店 / 神殿实际消费 100 金币', { act: 1 }),
      questDialogue('meeting', 'quartermaster', '到雷恩处核对真实补给需求', [
        ['narrator', '莉娅来到军需处，和雷恩一起听取你的交易记录。'],
        ['quartermaster', '我们从前只记武器，漏了沿途强化的费用。预算得分开留。'],
        ['guild', '也留一张椅子给商队代表。下次不等车到了才发现双方说的补给不是同一种。'],
        ['hero', '清单里写的是实际成交，不是我希望买到的东西。'],
        ['quartermaster', '这样就能用。要活下来的预算，经不起好看的猜测。'],
      ], '军需处 · 商路预算'),
    ]),
    job('frost_post', '霜原的慢信', 30, 'feather', 'guild', '确认霜原神殿路线，让慢到的消息不再被当成失联', [
      questDialogue('slow_post', 'guild', '听莉娅说明霜原通信的延误', [
        ['guild', '霜原来的消息晚了许久。每晚有人问我，是不是又有一支队伍失踪。'],
        ['hero', '延误一定意味着出事吗？'],
        ['guild', '不一定。先确认能供行人停留的神殿路线，我才能告诉他们该等多久、从哪儿找。'],
      ]),
      questEvent('frost_shrine', 'visit', 1, '进入第 2 幕霜原的属性神殿房', { act: 2, type: 'shrine' }),
      questDialogue('post_reply', 'guild', '向莉娅报告霜原停留点', [
        ['guild', '有明确停留点，寻人通知就不用只写“向北”。我会先补上这个。'],
        ['hero', '不能保证每封信都会按时回来。'],
        ['guild', '我也不会这样保证。把已知和未知分开说，比一句“都没事”更让人安心。'],
      ]),
    ]),
    job('swamp_notice', '潮湿的告示', 20, 'food', 'guild', '整理受潮告示，请食堂和公会共同确认新的通知方式', [
      questInspect('wet_notice', 'board', '在公会告示板辨认受潮的粮运通知', [
        ['narrator', '粮运通知的一角卷起，墨迹把“暂缓”晕成了“恢复”。'],
        ['hero', '这两个词看错了，可不是白跑一趟那么简单。'],
        ['narrator', '你记下模糊位置，准备请食堂确认真正的安排。'],
      ], '公会告示板 · 粮运通知'),
      questDialogue('food_notice', 'cook', '请米洛确认粮运通知的原意', [
        ['cook', '写的是暂缓。腐沼的路还没确认，我可不敢让送粮的人照着模糊的字往里走。'],
        ['hero', '能换一张清楚的？'],
        ['cook', '当然。也告诉莉娅，关键通知加上日期和口头确认，纸不是永远可靠的。'],
      ]),
      questDialogue('notice_rule', 'guild', '向莉娅建议补给通知的确认方式', [
        ['guild', '日期、清楚的状态、发布人，三项都写大些。临时停运还要当面确认。'],
        ['hero', '一张受潮的纸能改变很多人的计划。'],
        ['guild', '所以公会不能把贴好纸当成工作结束。谢谢你替我们看了一眼最不起眼的角落。'],
      ]),
    ]),
    job('desert_guarantor', '驿站的担保人', 35, 'coin', 'guild', '查访黄沙商店，并让诺拉修正过度乐观的商路承诺', [
      questDialogue('guarantee', 'guild', '与莉娅讨论黄沙商路的担保', [
        ['guild', '黄沙的商队想要一份“全程安全”的担保。我能盖章，却不能让一句话挡住风沙。'],
        ['hero', '那还怎么签？'],
        ['guild', '先找出确实存在的补给点。承诺我们能提供的帮助，别承诺道路没有危险。'],
      ]),
      questEvent('desert_shop', 'visit', 1, '进入第 4 幕黄沙的旅行商店', { act: 4, type: 'shop' }),
      questDialogue('wording', 'archivist', '请诺拉核对黄沙担保的措辞', [
        ['archivist', '“已确认补给点”可以写，“全程安全”不能写。地形会变，档案不该假装能替未来作证。'],
        ['hero', '莉娅担心这样会让商队犹豫。'],
        ['archivist', '让他们知道该准备什么，才是真正帮他们出发。我把这段说明送给她。'],
      ]),
    ]),
    job('sky_weight', '带不上云端的箱子', 35, 'boots', 'guild', '从天穹神殿路线反推远征行装，讨论什么必须带、什么可以留下', [
      questDialogue('packing_council', 'guild', '参加公会的云端行装讨论', [
        ['narrator', '莉娅把一张装载表摊开，雷恩和米洛站在桌子两边。'],
        ['quartermaster', '备用兵器不能少，坏了一把，总得有下一把。'],
        ['cook', '每个人都多一把，食物就只够半路。不能指望他们吃铁。'],
        ['guild', '先确认天穹有没有沿途整备点。我们按路线取舍，别比谁声音大。'],
        ['hero', '我去找神殿，回来把实际情况放在表上。'],
      ], '公会门廊 · 云端行装会谈'),
      questEvent('sky_shrine', 'visit', 1, '进入第 5 幕天穹的属性神殿房', { act: 5, type: 'shrine' }),
      questDialogue('packing_reply', 'guild', '向莉娅提交天穹整备路线', [
        ['guild', '有沿途整备点，可以少带一部分冗余。但应急食物还是单独留出。'],
        ['hero', '地图上有一个点，不代表谁都能随时到达。'],
        ['guild', '这句话也写进去。路线为判断提供依据，不能替人省去判断。'],
      ]),
    ]),
    job('void_return', '归队时先数人', 45, 'eye', 'guild', '清理虚空终焉的撤回路线，再向艾琳核对返程规则', [
      questDialogue('return_order', 'guild', '向莉娅领取虚空返程规则', [
        ['guild', '越往深处，我们的报告越像战果清单。可我先想知道谁回来了。'],
        ['hero', '撤回路线也写进委托？'],
        ['guild', '是。先在虚空终焉清出四间战斗房，再和艾琳核对接应方式。别只把出口当下一步的门。'],
      ]),
      questEvent('void_clear', 'clear', 4, '清理第 6 幕虚空终焉的 4 间战斗房', { act: 6 }),
      questDialogue('return_check', 'mentor', '向艾琳核对虚空远征的返程规则', [
        ['mentor', '回到法阵边先停稳，再点人、核对状态，最后才报战果。顺序不能反过来。'],
        ['hero', '莉娅把这次任务写成了撤回路线。'],
        ['mentor', '她终于肯把担心写成安排了。告诉她，这份安排我会跟着执行。'],
      ]),
    ]),
    job('memorial_day', '纪念日也有热饭', 25, 'feather', 'guild', '核对英灵碑的纪念日期，安排一个属于全镇的纪念日', [
      questInspect('memorial_date', 'stele', '在英灵碑核对纪念日的小字', [
        ['narrator', '纪念日期刻在碑座侧面。旁边写着“为守路与归来者”。'],
        ['hero', '不只是一个悼念名字的日子，也该让活着的人聚在一起。'],
        ['narrator', '你记下措辞，想先听听食堂怎样安排这一餐。'],
      ], '英灵碑 · 纪念日'),
      questDialogue('memorial_meal', 'cook', '请米洛安排纪念日的公共餐', [
        ['cook', '不必摆得吓人。热饭、空椅子和让人把话说完的时间，先准备这些。'],
        ['hero', '空椅子给谁？'],
        ['cook', '给暂时回不来的人。不是宣布他们死了，也不是逼大家假装他们今晚会回来。'],
      ]),
      questDialogue('memorial_plan', 'guild', '和莉娅核对纪念日安排', [
        ['narrator', '诺拉和米洛来到公会，莉娅在日程上留出了一整晚。'],
        ['archivist', '碑文的原句是“守路与归来者”，我会在开场时读清楚。'],
        ['cook', '食堂不催散席。想安静吃饭的人也有地方坐。'],
        ['guild', '公会不在那天宣布战果。让名字和人，都有被记得的位置。'],
        ['hero', '这比我想象中的纪念日平常。'],
        ['guild', '能平常地聚在一起，也是大家守住的东西。'],
      ], '公会门廊 · 纪念日筹备'),
    ]),
    job('clerk_leave', '委托官的空白一页', 20, 'book', 'guild', '帮莉娅安排一次休息，让公会的日程不再围着一个人转', [
      questDialogue('blank_page', 'guild', '询问莉娅日程里唯一的空白', [
        ['guild', '这页没写事，不代表我没事。只是还没来得及补上。'],
        ['hero', '那有没有可能，把它当成休息？'],
        ['guild', '公会没人接手……你先问诺拉愿不愿意代看登记册。我不会让她白白加一整天班。'],
      ]),
      questDialogue('cover', 'archivist', '请诺拉确认公会登记的交接办法', [
        ['archivist', '登记我可以代看半天，复杂委托留到她回来。交接要写清楚，不是把所有事情扔给另一个人。'],
        ['hero', '她会说还有事没做完。'],
        ['archivist', '事情永远做不完。请告诉她，空白不是失职，是给明天留的力气。'],
      ]),
      questDialogue('leave', 'guild', '把公会半日交接方案告诉莉娅', [
        ['guild', '只代看登记，不接新决策……这样确实可以。那这页就不补了。'],
        ['hero', '准备去哪儿？'],
        ['guild', '先去食堂坐着吃完一碗饭。别笑，这件事我也很久没做完整了。'],
      ]),
    ]),

    // 艾琳：把知识教给会回来的学生。
    job('first_followthrough', '落剑之后的一步', 25, 'sword', 'mentor', '用生锈铁剑练习完整收招，让导师观察基础动作', [
      questDialogue('lesson', 'mentor', '听艾琳讲收招的意义', [
        ['mentor', '你盯着命中的那一刻，却把下一步交给了运气。先拿最熟悉的剑练收招。'],
        ['hero', '生锈铁剑也能用来上课？'],
        ['mentor', '越普通越看得清。不要把好兵器的威力误认成自己动作的余地。'],
      ]),
      questEvent('sword', 'starter', 1, '到军需官处选择生锈铁剑', { id: 'rusty' }),
      questEvent('followthrough', 'practice', 6, '用生锈铁剑命中营地训练木桩 6 次', { id: 'rusty' }),
      questDialogue('review', 'mentor', '请艾琳复盘铁剑收招练习', [
        ['mentor', '现在你会把剑收回能继续行动的位置了。这一步没有伤害数字，却会救你。'],
        ['hero', '木桩不会追击我。'],
        ['mentor', '对。所以这只是基础练习，别把六次命中当成实战毕业。'],
      ]),
    ]),
    job('hands_of_learning', '学会的本领放在哪里', 25, 'book', 'mentor', '带着已有天赋讨论使用方式，再向铁匠解释自己的需求', [
      questOwned('learned', 'talent', 3, '累计习得 3 级天赋（已有等级计入）'),
      questDialogue('apply', 'mentor', '与艾琳讨论已有天赋的用途', [
        ['mentor', '有三分本领，不必急着证明能做十分的事。先说哪一项最帮得到你。'],
        ['hero', '不同装备会改变我的习惯。'],
        ['mentor', '那就把习惯告诉布洛克。别只说“做一把更强的”，告诉他你需要什么余地。'],
      ]),
      questDialogue('requirements', 'smith', '向布洛克说明天赋与装备的配合', [
        ['smith', '艾琳的课开始管到我的工坊了？好事，至少你终于不只盯着刃口。'],
        ['hero', '我想让装备适合学会的动作。'],
        ['smith', '这才叫需求。把握柄、重量和出手距离说清楚，工匠就不用替你猜。'],
      ]),
    ]),
    job('steady_breath', '快脚步，慢呼吸', 25, 'boots', 'mentor', '预订轻盈餐，练习命中后仍能保持判断的节奏', [
      questEvent('light_meal', 'meal', 1, '到米洛处预订轻盈餐', { id: 'swift' }),
      questEvent('rhythm', 'practice', 7, '使用任意武器命中营地训练木桩 7 次'),
      questDialogue('breath_review', 'mentor', '和艾琳复盘速度与节奏的关系', [
        ['mentor', '腿变快不代表判断也变快。轻盈餐是帮你行动，不是催你每一步都抢。'],
        ['hero', '训练时更容易急着接下一击。'],
        ['mentor', '能发现急，就还有办法停。下一次练习把呼吸当节拍，不把敌人的声音当指挥。'],
      ]),
    ]),
    job('frost_silence', '雪地里听不见的回响', 30, 'gem', 'mentor', '查访霜原神殿，辨清安静与危险之间的区别', [
      questDialogue('silence', 'mentor', '听艾琳说明霜原的声音误判', [
        ['mentor', '学生说霜原神殿很安静，仿佛力量已经消失。我担心他们把没有回声当成没有危险。'],
        ['hero', '你想听现场观察？'],
        ['mentor', '对。确认神殿路线，回来我们只讨论你实际看到的，不替整个霜原下结论。'],
      ]),
      questEvent('frost_route', 'visit', 1, '进入第 2 幕霜原的属性神殿房', { act: 2, type: 'shrine' }),
      questDialogue('listen', 'mentor', '向艾琳交付霜原神殿的观察', [
        ['mentor', '即使安静，神殿仍在那里。声音少了，眼睛和脚下的判断就更重要。'],
        ['hero', '不能只凭一个熟悉的回响认路。'],
        ['mentor', '正是。把这句话留下，下一位出发的人少犯一次熟悉带来的错。'],
      ]),
    ]),
    job('swamp_reserve', '在潮气里留一口气', 35, 'heart', 'mentor', '安排暖胃餐，查访腐沼生命之泉，补充一条稳妥的休息路线', [
      questDialogue('reserve', 'mentor', '向艾琳了解腐沼行程的休息安排', [
        ['mentor', '腐沼让人不舒服时，最容易用“赶紧走完”代替休息。越想忍，越该提前留好退路。'],
        ['hero', '餐食和路线都要准备？'],
        ['mentor', '先预订暖胃炖汤，再确认生命之泉所在的房间。这次是路线调查，不要求你先受伤。'],
      ]),
      questEvent('warmth', 'meal', 1, '到米洛处预订暖胃炖汤', { id: 'hearty' }),
      questEvent('swamp_fountain', 'visit', 1, '进入第 3 幕腐沼的生命之泉房', { act: 3, type: 'fountain' }),
      questDialogue('route_report', 'mentor', '向艾琳报告腐沼的休息路线', [
        ['mentor', '看见了泉台，就把它记为停留点。泉水是否确实恢复伤势，要另外验证，别混在一起。'],
        ['hero', '这次我只确认路线。'],
        ['mentor', '够了。承认观察的边界，也是控制力量的一部分。'],
      ]),
    ]),
    job('desert_echo', '回声会不会说谎', 25, 'eye', 'mentor', '在法阵比较回响方向，与导师和书记官讨论旅行笔记中的误判', [
      questInspect('echo', 'portal', '在出征法阵观察光流与回声的方向', [
        ['narrator', '你绕到法阵另一边。同样的脉动，听起来仿佛来自相反方向。'],
        ['hero', '声音跟着站位改变，铜环上的光却仍沿原来的纹路流动。'],
        ['narrator', '你把站位也记进观察，准备让艾琳判断这是否影响认路。'],
      ], '出征法阵 · 站位观察'),
      questDialogue('echo_lesson', 'mentor', '与艾琳讨论回声认路的局限', [
        ['mentor', '黄沙旧笔记说“循钟声返回”，却没写钟声从哪里传来。这种口诀缺了条件。'],
        ['hero', '法阵旁也会听错方向。'],
        ['mentor', '去请诺拉保留原句，再加上说明。不能为了让口诀好记，就把不确定藏起来。'],
      ]),
      questDialogue('echo_annotation', 'archivist', '与诺拉、艾琳一起补注回声口诀', [
        ['narrator', '艾琳带着你的站位记录来到档案室，诺拉把旧笔记翻到钟声那一页。'],
        ['archivist', '原文我保留。旁注写“须结合地形与可见路标”，可以吗？'],
        ['mentor', '再加一句：回声会绕路，人不能只跟声音走。'],
        ['hero', '这会让一句口诀变成长段说明。'],
        ['archivist', '能救人的说明，不必为了顺口删到只剩一半。'],
      ], '档案室 · 回声笔记会读'),
    ]),
    job('storm_grounding', '把雷声写进图纸', 40, 'bolt', 'mentor', '结合已有图纸与天穹神殿的观察，讨论力量怎样安全地离开', [
      questOwned('drawings', 'blueprint', 2, '拥有 2 张已解锁的装备图纸（已有图纸计入）'),
      questDialogue('grounding', 'mentor', '向艾琳了解天穹的导流问题', [
        ['mentor', '有人把导流叫作抵抗，以为撑得越久越好。可雷霆总得找到离开的路。'],
        ['hero', '装备上的槽纹也管离开的方向？'],
        ['mentor', '布洛克懂工艺。你再确认天穹神殿的路线，我们用两个角度讨论同一件事。'],
      ]),
      questEvent('sky_ground', 'visit', 1, '进入第 5 幕天穹的属性神殿房', { act: 5, type: 'shrine' }),
      questDialogue('ground_review', 'mentor', '与艾琳复盘天穹导流观察', [
        ['mentor', '图纸给了结构，现场给了环境。两样都要看，不能把镇里的办法原样搬上云端。'],
        ['hero', '知道怎么接住，也要知道往哪里送。'],
        ['mentor', '这才是这节课的意思。等雷恩整备时，我会把这份观察交给他。'],
      ]),
    ]),
    job('altar_terms', '馈赠下面的小字', 35, 'heart', 'mentor', '自愿核实一次祭坛交换，与导师讨论别人有权知道的代价', [
      questDialogue('terms', 'mentor', '听艾琳讲祭坛调查的前提', [
        ['mentor', '我想核对祭坛说明，但不要求你为了说明受伤。只有本来准备交换时，才继续这项任务。'],
        ['hero', '如果一直不需要？'],
        ['mentor', '就放弃。一个可以拒绝的调查，才有资格谈别人的选择。'],
      ]),
      questEvent('exchange', 'altar', 1, '自愿成功完成 1 次生命祭坛交换（可放弃）'),
      questDialogue('fine_print', 'mentor', '向艾琳核对祭坛交换的代价说明', [
        ['mentor', '馈赠写得很大，代价却常被人略过。我会把两者放在同一行。'],
        ['hero', '会有人觉得这样太扫兴。'],
        ['mentor', '清楚之后仍然选择，和不知道代价就伸手，不是同一件事。'],
      ]),
    ]),
    job('void_anchor', '在裂隙前记住地面', 45, 'gem', 'mentor', '先复核营地法阵，再清理虚空战斗房，为远行保留稳定的参考', [
      questInspect('home_reference', 'portal', '在出征法阵记录稳定的光流节拍', [
        ['narrator', '你把注意力从远方收回脚下，观察完整的一次光流。'],
        ['hero', '内环与外环要分别看，不能把所有闪光当成同一个信号。'],
        ['narrator', '这份记录留在你熟悉的归途边，成为出发前可以复核的参考。'],
      ], '出征法阵 · 归途参考'),
      questEvent('void_room', 'clear', 3, '清理第 6 幕虚空终焉的 3 间战斗房', { act: 6 }),
      questDialogue('anchor_review', 'mentor', '向艾琳复盘虚空远征的判断', [
        ['mentor', '远处的变化越多，越需要知道哪一项判断来自观察，哪一项只是习惯。'],
        ['hero', '营地的记录不能代替裂隙里的现场。'],
        ['mentor', '对。它帮你发现差异，不是告诉你一切仍然相同。记住地面，才知道何时已经离开地面。'],
      ]),
    ]),
    job('lesson_back', '轮到学生讲一遍', 40, 'book', 'mentor', '带着累计天赋经验，与导师和军需官讨论怎样教会下一位新人', [
      questOwned('experience', 'talent', 15, '累计习得 15 级天赋（已有等级计入）'),
      questDialogue('teach_back', 'mentor', '向艾琳说明自己的整备经验', [
        ['mentor', '你已经学了不少。今天不加一条新规矩，你来讲一遍出发前怎样判断。'],
        ['hero', '我会先看装备、路线和还剩多少余地。'],
        ['mentor', '很好。去和雷恩谈谈，让这份经验变成新人听得懂的话，不是高手才能做到的表演。'],
      ]),
      questDialogue('newcomer_lesson', 'quartermaster', '与雷恩和艾琳共同整理新人课程', [
        ['narrator', '艾琳来到训练场旁，雷恩拿出旧的新人整备清单。'],
        ['quartermaster', '我以前把“动作要快”写在第一条。是不是太早了？'],
        ['mentor', '先写“知道为什么做这一步”。快可以慢慢练，糊涂地快最难改。'],
        ['hero', '我还想加上能停下和能返回，不把继续前进当唯一成绩。'],
        ['quartermaster', '那就从今天改。你留下的经验，会跟下一把普通铁剑一起交出去。'],
      ], '训练场旁 · 新人课程'),
    ]),

    // 布洛克：工坊的手艺与工匠自己的生活。
    job('wood_grain', '木纹里的方向', 25, 'hammer', 'smith', '试用粗木大棒，观察看似简单的木柄怎样影响握持', [
      questDialogue('wood_lesson', 'smith', '听布洛克说明木柄的纹路', [
        ['smith', '别嫌粗木大棒简单。木纹走错了，再普通的武器也会先在握柄上出问题。'],
        ['hero', '我用它练几下？'],
        ['smith', '六下就够看看手感。去军需处领试用的，别把工坊里的支架抡出去。'],
      ]),
      questEvent('club', 'starter', 1, '到军需官处选择粗木大棒', { id: 'club' }),
      questEvent('wood_test', 'practice', 6, '用粗木大棒命中营地训练木桩 6 次', { id: 'club' }),
      questDialogue('grain_review', 'smith', '请布洛克检查木棒试用后的握持', [
        ['smith', '握持的方向对了。普通木柄也有自己的道理，不是稀有东西才值得认真看。'],
        ['hero', '它没有华丽的效果。'],
        ['smith', '能让人稳稳拿住，就是工匠先要做到的效果。'],
      ]),
    ]),
    job('edge_patience', '刃口不用天天重磨', 25, 'axe', 'smith', '整备手斧并训练十次，区分磨损与使用习惯', [
      questEvent('hatchet', 'starter', 1, '到军需官处选择樵夫斧', { id: 'hatchet' }),
      questEvent('edge_test', 'practice', 10, '用樵夫斧命中营地训练木桩 10 次', { id: 'hatchet' }),
      questDialogue('edge_review', 'smith', '请布洛克辨认训练后的手斧磨痕', [
        ['smith', '十下之后只有很浅的接触痕。你担心的钝，更多是出手角度变了。'],
        ['hero', '所以不用立刻再磨？'],
        ['smith', '别把刃越磨越薄来掩盖动作。工具需要维护，也需要有耐心的主人。'],
      ]),
    ]),
    job('makers_marks', '图纸角落的名字', 30, 'hammer', 'smith', '核对三份图纸里的工匠署名，给默默做事的人留下记录', [
      questOwned('drawings', 'blueprint', 3, '拥有 3 张已解锁的装备图纸（已有图纸计入）'),
      questDialogue('signature', 'smith', '与布洛克辨认图纸上的工匠署名', [
        ['smith', '总有人把图纸角落裁掉，好让装裱看起来整齐。偏偏名字和改动日期都在那儿。'],
        ['hero', '会看不出是谁改过工法。'],
        ['smith', '去告诉诺拉，别只记兵器的名字。画线的人，也该算在传承里。'],
      ]),
      questDialogue('credit', 'archivist', '请诺拉补注图纸中的工匠信息', [
        ['archivist', '我会按能辨认的署名登记，辨不清的留空，不用一个响亮头衔代替所有人。'],
        ['hero', '布洛克说改动日期也要保留。'],
        ['archivist', '对。手艺不是一次诞生的奇迹，而是有人一遍遍改好一点。'],
      ]),
    ]),
    job('frost_fit', '冻手时的握柄', 30, 'sword', 'smith', '确认霜原商店路线，讨论寒冷地区装备维护的限制', [
      questDialogue('cold_handle', 'smith', '向布洛克了解霜原握柄维护', [
        ['smith', '戴厚手套时，熟悉的握柄也会变陌生。别等到霜原才发现备用工具全留在家。'],
        ['hero', '路上能补给吗？'],
        ['smith', '先确认旅行商店在哪里。知道能停在哪儿，再谈哪一件必须自己带。'],
      ]),
      questEvent('frost_shop', 'visit', 1, '进入第 2 幕霜原的旅行商店', { act: 2, type: 'shop' }),
      questDialogue('fit_report', 'smith', '向布洛克说明霜原补给路线', [
        ['smith', '路上有店，就能在整备表里写明补给选择。但不能写成所有东西随时都有。'],
        ['hero', '去过一家店，还不能替整条路保证。'],
        ['smith', '你已经比我的旧清单严谨了。我把“必有”改成“可查访”。'],
      ]),
    ]),
    job('swamp_maintenance', '锈迹先从哪里来', 40, 'coin', 'smith', '在腐沼实际使用补给，再向工坊报告远途维护开支', [
      questDialogue('corrosion', 'smith', '听布洛克安排腐沼维护调查', [
        ['smith', '腐沼回来的人总抱怨装备不经用。我想先知道他们有没有留维护的余地。'],
        ['hero', '你要我在路上换装备？'],
        ['smith', '按自己的需要消费。去看看商店，再记录实际整备花费，别为了我买一件用不上的。'],
      ]),
      questEvent('swamp_shop', 'visit', 1, '进入第 3 幕腐沼的旅行商店', { act: 3, type: 'shop' }),
      questEvent('maintenance_cost', 'goldspend', 150, '在第 3 幕商店 / 神殿实际消费 150 金币', { act: 3 }),
      questDialogue('cost_report', 'smith', '向布洛克报告腐沼整备开支', [
        ['smith', '费用有记录，下一份整备表就不能只把钱留给一场大采购。路上也要留余量。'],
        ['hero', '这不能证明每一道锈迹都来自缺钱。'],
        ['smith', '当然。我问的是一种可能，不能把一份账单当所有人的答案。'],
      ]),
    ]),
    job('sand_tolerance', '留给沙粒的余地', 35, 'hammer', 'smith', '以四份图纸讨论黄沙行装，让工坊、军需和导师共同确认维护原则', [
      questOwned('drawings', 'blueprint', 4, '拥有 4 张已解锁的装备图纸（已有图纸计入）'),
      questDialogue('tolerance', 'smith', '与布洛克讨论图纸中的装配余量', [
        ['smith', '严丝合缝不是什么时候都好。黄沙里一粒沙卡进去，漂亮的配合也可能不肯动。'],
        ['hero', '那就做得松些？'],
        ['smith', '也不能乱松。去叫雷恩一起看，使用和搬运的要求得说在同一张桌上。'],
      ]),
      questDialogue('tolerance_council', 'quartermaster', '到军需处参加装配与维护讨论', [
        ['narrator', '布洛克带着图纸来到军需处，艾琳也来听远征维护的安排。'],
        ['quartermaster', '我需要能检修，不是遇到一点砂就整件丢掉。'],
        ['smith', '所以连接处留检查位置，装箱时标方向。不能只写一个“结实”。'],
        ['mentor', '课程里再加上先检查、后用力。卡住时硬扯，往往把小问题扯成断口。'],
        ['hero', '图纸的余量和行动的余量，原来都要提前留。'],
      ], '军需处 · 黄沙维护会谈'),
    ]),
    job('sky_conductors', '铁匠问的不是咒语', 40, 'bolt', 'smith', '查访天穹神殿，替工坊向艾琳核对导流工艺的边界', [
      questDialogue('conductor_question', 'smith', '听布洛克说明导流工艺的疑问', [
        ['smith', '艾琳说槽纹负责导流，可我不知道云端那边的力量是不是也照这个方向来。'],
        ['hero', '我去观察天穹神殿的路线。'],
        ['smith', '再请她说明哪些能类比、哪些不能。工匠最怕一声“差不多”就叫开炉。'],
      ]),
      questEvent('sky_shrine', 'visit', 1, '进入第 5 幕天穹的属性神殿房', { act: 5, type: 'shrine' }),
      questDialogue('limits', 'mentor', '向艾琳转达布洛克的导流疑问', [
        ['mentor', '方向可以作参考，强度不能照搬。请他先保留检修口，不要为了好看封死。'],
        ['hero', '他担心“差不多”会变成一件失败的成品。'],
        ['mentor', '担心得对。把这份限制带回去，我会亲自核对每个不能类比的地方。'],
      ]),
      questDialogue('answer', 'smith', '把艾琳的工艺限制交给布洛克', [
        ['smith', '能检查，就能在发现不对时改。这个回答比一句包你成功让我放心。'],
        ['hero', '艾琳会亲自来核对。'],
        ['smith', '那我留着图纸和炉边的位置。手艺不是谁一句话讲完就算懂了。'],
      ]),
    ]),
    job('unfamiliar_shape', '不像兵器的兵器', 30, 'eye', 'smith', '新增两件装备见闻，让工坊讨论外形与用途是否一致', [
      questDialogue('odd_shape', 'smith', '听布洛克说明陌生装备的判断方法', [
        ['smith', '看见一个尖角，不等于它用来刺；看见一个圆环，也不等于它是护盾。'],
        ['hero', '你想核对图鉴里的形制？'],
        ['smith', '带回两件新装备的见闻。若图鉴已经齐了，我们就直接核对完整记录，不凭空要求新发现。'],
      ]),
      questEvent('new_forms', 'discover', 2, '发现 2 件新装备（图鉴全收集可直接核对）'),
      questDialogue('form_review', 'smith', '和布洛克讨论新增装备的外形与用途', [
        ['smith', '形状只是线索。用途、装配和磨痕放在一起，才不容易认错。'],
        ['hero', '遇到虚空里的东西时，这个习惯更重要。'],
        ['smith', '是。越看不懂，越别急着给它起一个听起来很懂的名字。'],
      ]),
    ]),
    job('repair_window', '工坊也要关一次门', 20, 'book', 'smith', '检查告示上的交付冲突，替铁匠和公会安排停炉维护', [
      questInspect('deadline', 'board', '检查告示板的工坊维护与交付日期', [
        ['narrator', '停炉维护和一批装备交付写在同一天。两张纸都很新。'],
        ['hero', '谁也不看另一张，就会有人等一整天。'],
        ['narrator', '你记下冲突，决定先让工坊确认不能推迟的那件事。'],
      ], '公会告示板 · 工坊日程'),
      questDialogue('furnace', 'smith', '向布洛克核对停炉维护的安排', [
        ['smith', '炉子得停，裂的不是刀，是炉壁。我不能为了准时交货让整个工坊冒险。'],
        ['hero', '莉娅那边需要改交付日期。'],
        ['smith', '请她写明原因。我宁愿被人嫌慢，也不让大家以为工匠只是在拖。'],
      ]),
      questDialogue('reschedule', 'guild', '请莉娅调整工坊交付通知', [
        ['guild', '维护优先。新通知写清延期和原因，已经登记的人逐个告知。'],
        ['hero', '布洛克担心别人觉得他拖延。'],
        ['guild', '那就别让他一个人解释。公会排出的日期，公会也负责改清楚。'],
      ]),
    ]),
    job('apprentice_wage', '学徒的第一笔账', 35, 'coin', 'smith', '积累真实整备消费，讨论手艺价格与工匠的生活', [
      questDialogue('wage_question', 'smith', '听布洛克讲学徒的报价疑问', [
        ['smith', '学徒只算铁和炭，以为自己的时间不值钱。这样的账，最后会让人连饭都不敢吃。'],
        ['hero', '怎样让他看清真正的成本？'],
        ['smith', '记录你路上实际花的整备钱，再听米洛说说一顿饭背后的工作。用真事讲，别训话。'],
      ]),
      questEvent('real_costs', 'goldspend', 300, '在地牢商店 / 神殿实际消费 300 金币'),
      questDialogue('meal_work', 'cook', '向米洛了解一顿饭背后的工作', [
        ['cook', '买菜、洗锅、备火、等归来的人。这些都不在一碗汤的重量里，可总有人在做。'],
        ['hero', '布洛克的学徒只肯算材料。'],
        ['cook', '那我跟你去。让他知道手艺养人不丢脸，养不活人的价格才不能长久。'],
      ]),
      questDialogue('wage_review', 'smith', '到工坊共同讨论合理的手艺价格', [
        ['narrator', '米洛来到工坊，雷恩也带来一份整备清单；布洛克把学徒的报价放在桌上。'],
        ['cook', '劳动不比材料虚。锅空着等一夜，第二天的人也会累。'],
        ['quartermaster', '军需愿意按清楚的工时安排订单，别让学徒靠硬扛来替预算省钱。'],
        ['smith', '好。我教他把检验和维护写进账里，也把吃饭的时间留出来。'],
        ['hero', '这笔账最后还是在说人。'],
        ['smith', '工坊里的每件东西，本来就是人做出来的。'],
      ], '工坊 · 手艺价格会谈'),
    ]),

    // 雷恩：整备不是把每个人排成同一种人。
    job('ordinary_sword', '普通铁剑的交接', 20, 'sword', 'quartermaster', '确认普通初始武器，给下一位使用者留下清楚的交接说明', [
      questEvent('issue_sword', 'starter', 1, '到军需官处选择生锈铁剑', { id: 'rusty' }),
      questDialogue('handover', 'quartermaster', '与雷恩讨论铁剑的交接说明', [
        ['quartermaster', '旧交接只写“铁剑一把”。这太省字，接手的人根本不知道先检查哪儿。'],
        ['hero', '先让布洛克给个检查顺序？'],
        ['quartermaster', '对。写给第一次拿武器的人看，不是写给检查表上的一个勾。'],
      ]),
      questDialogue('check_order', 'smith', '请布洛克补充普通铁剑的检查顺序', [
        ['smith', '先握柄、再看连接、最后看刃口。别一见锈就只顾着磨亮。'],
        ['hero', '雷恩想把这几项写进交接。'],
        ['smith', '写吧，也加上不懂就问。普通装备更不该让新人不好意思求助。'],
      ]),
    ]),
    job('two_blades', '两把短刃不是两倍着急', 30, 'dagger', 'quartermaster', '用双刃匕首练习节奏，再请军需官复盘', [
      questEvent('twin', 'starter', 1, '到军需官处选择双刃匕首', { id: 'twin' }),
      questEvent('twin_train', 'practice', 12, '用双刃匕首命中营地训练木桩 12 次', { id: 'twin' }),
      questDialogue('twin_review', 'quartermaster', '请雷恩复盘双刃训练的节奏', [
        ['quartermaster', '两把刃不是让你两只手都抢着往前。留下能重新站稳的时间。'],
        ['hero', '命中很快，反而容易觉得还可以再来一下。'],
        ['quartermaster', '这正是要练的。试用武器，是认识它会怎样影响你，不是给自己挑一种更快的冲动。'],
      ]),
    ]),
    job('distance_choice', '一张清单，两种距离', 25, 'bow', 'quartermaster', '依次确认手斧和短弓，比较不同距离下的整备需求', [
      questDialogue('comparison', 'quartermaster', '听雷恩安排不同距离的武器试用', [
        ['quartermaster', '新人总问哪把最好。我想让他们先问：在哪个距离，准备怎样行动？'],
        ['hero', '先比较手斧和短弓？'],
        ['quartermaster', '各确认一次就好。这张清单记录选择顺序，不假装你同时带着两把武器。'],
      ]),
      questEvent('axe_choice', 'starter', 1, '到军需官处先选择樵夫斧', { id: 'hatchet' }),
      questEvent('bow_choice', 'starter', 1, '到军需官处再选择短弓', { id: 'shortbow' }),
      questDialogue('distance_review', 'quartermaster', '与雷恩复盘两次武器选择', [
        ['quartermaster', '现在手里的是短弓，先前的斧子已经归还。每次整备都要知道自己实际带着什么。'],
        ['hero', '近战和远程，留退路的方式也不同。'],
        ['quartermaster', '这比评一个最好有用。装备习惯会变，清单不能把人锁死。'],
      ]),
    ]),
    job('frost_packing', '别把热汤写成棉衣', 35, 'food', 'quartermaster', '预订暖胃餐并查访霜原商店，把不同整备项目的作用分清', [
      questDialogue('packing', 'quartermaster', '向雷恩领取霜原整备核对项', [
        ['quartermaster', '有人说喝了暖胃汤就不用管寒冷。我得把这误会从清单里删掉。'],
        ['hero', '餐食和途中补给分开看。'],
        ['quartermaster', '对。预订暖胃餐，再确认霜原商店路线。准备多一分余地，不写一条包办一切的承诺。'],
      ]),
      questEvent('warm_meal', 'meal', 1, '到米洛处预订暖胃炖汤', { id: 'hearty' }),
      questEvent('frost_store', 'visit', 1, '进入第 2 幕霜原的旅行商店', { act: 2, type: 'shop' }),
      questDialogue('packing_review', 'quartermaster', '向雷恩交付霜原整备核对结果', [
        ['quartermaster', '餐食给生命留余量，商店给选择留余量。清单分别写，谁也不替谁。'],
        ['hero', '知道一项准备的作用，也要知道它的限制。'],
        ['quartermaster', '好。你这句话放在表头，比“准备充足”四个字更清楚。'],
      ]),
    ]),
    job('swamp_aid_route', '担架该往哪边抬', 35, 'heart', 'quartermaster', '确认腐沼泉水房路线，让食堂补给和伤者休息点能对上', [
      questDialogue('aid', 'quartermaster', '听雷恩说明腐沼救护路线的空缺', [
        ['quartermaster', '路线图只画到战斗房，抬伤者的人却要找能停下的地方。这个空缺是我漏的。'],
        ['hero', '先确认生命之泉房？'],
        ['quartermaster', '是，调查位置即可，不必为任务受伤。把路线也告诉米洛，补给不能只送到出发的人手里。'],
      ]),
      questEvent('aid_fountain', 'visit', 1, '进入第 3 幕腐沼的生命之泉房', { act: 3, type: 'fountain' }),
      questDialogue('aid_food', 'cook', '向米洛报告腐沼的伤者停留路线', [
        ['cook', '知道哪里能停，热汤和干粮就不必一股脑全给前线。回程的人也需要。'],
        ['hero', '雷恩会把这条路写进救护安排。'],
        ['cook', '那我跟他的表对着做。人从哪儿回来，饭就该往哪儿送。'],
      ]),
    ]),
    job('desert_budget', '留在驿站的零钱', 40, 'coin', 'quartermaster', '在黄沙实际消费，核对远征预算中的途中整备费用', [
      questDialogue('budget', 'quartermaster', '与雷恩核对黄沙预算的漏项', [
        ['quartermaster', '上一张账把所有钱都算在出发前。到了驿站，账上什么都够，口袋却空。'],
        ['hero', '你要看实际途中消费？'],
        ['quartermaster', '对，在黄沙按需要整备，把真实开支交给诺拉。不是为了凑账去乱买。'],
      ]),
      questEvent('desert_cost', 'goldspend', 200, '在第 4 幕黄沙商店 / 神殿实际消费 200 金币', { act: 4 }),
      questDialogue('budget_record', 'archivist', '请诺拉登记黄沙的途中整备费用', [
        ['archivist', '我把出发前和途中分开记。不能因为后一项写起来麻烦，就让人靠自己的口袋补上。'],
        ['hero', '雷恩以前的表没有这一栏。'],
        ['archivist', '那就多一栏。表格是给生活用的，生活不必为了表格假装整齐。'],
      ]),
    ]),
    job('sky_archer', '弓手也要站稳', 30, 'bow', 'quartermaster', '用短弓完成训练，与军需官、铁匠和导师讨论站位', [
      questEvent('bow', 'starter', 1, '到军需官处选择短弓', { id: 'shortbow' }),
      questEvent('bow_hits', 'practice', 10, '用短弓命中营地训练木桩 10 次', { id: 'shortbow' }),
      questDialogue('archer_council', 'quartermaster', '到军需处参加弓手站位复盘', [
        ['narrator', '雷恩请布洛克和艾琳到训练场边，各看一遍你的短弓动作。'],
        ['smith', '弦和握柄都正常。别把急着放手当成器械回弹太快。'],
        ['mentor', '先确认下一步的站位，才有余地把这一箭放稳。'],
        ['quartermaster', '天穹更容易让人只顾着远处的目标。我们先在地面把基础说清楚。'],
        ['hero', '三个人看的是同一次动作，却都指出了不同地方。'],
        ['mentor', '所以训练要听别人说，不是只盯命中的一瞬间。'],
      ], '训练场旁 · 弓手会诊'),
    ]),
    job('void_last_shop', '最后一处补给之后', 45, 'eye', 'quartermaster', '确认虚空商店路线，讨论走过补给点后何时该撤回', [
      questDialogue('last_store', 'quartermaster', '听雷恩说明虚空补给计划', [
        ['quartermaster', '我不想在计划里只写“继续深入”。走过最后确认的补给点，条件就变了。'],
        ['hero', '先确认虚空里的商店。'],
        ['quartermaster', '对。再和艾琳讨论条件变化时怎么判断，别等耗尽了才问能不能回头。'],
      ]),
      questEvent('void_shop', 'visit', 1, '进入第 6 幕虚空终焉的旅行商店', { act: 6, type: 'shop' }),
      questDialogue('retreat_terms', 'mentor', '和艾琳讨论离开补给点后的撤回条件', [
        ['mentor', '先看当前状态，再看已确认的退路。地图上的下一点，不能替你保证一定到得了。'],
        ['hero', '雷恩想把停止条件写进去。'],
        ['mentor', '很好。能按条件撤回，是计划执行成功的一种结果，不必另找一个失败的名字。'],
      ]),
    ]),
    job('night_stores', '夜里领粮的人', 20, 'food', 'quartermaster', '核对夜间领粮说明，避免轮换守卫因记录不清错过餐食', [
      questInspect('night_notice', 'board', '检查告示板的夜间领粮说明', [
        ['narrator', '告示写着“晚班自行登记”，登记地点却没有标明。'],
        ['hero', '白天人多时可以问，夜里就只剩这张不完整的纸。'],
        ['narrator', '你将漏掉的信息圈出，准备请军需官补上。'],
      ], '公会告示板 · 夜间领粮'),
      questDialogue('night_route', 'quartermaster', '向雷恩确认晚班登记地点', [
        ['quartermaster', '应该写军需处，不是让他们自己找。我会把交接时刻也补上。'],
        ['hero', '食堂知道这套安排吗？'],
        ['quartermaster', '还得麻烦你去确认。我不能再把另一边“应该知道”当成已经交接。'],
      ]),
      questDialogue('night_meal', 'cook', '和米洛核对晚班餐食的交接', [
        ['cook', '我按军需处的晚班名单留餐，取餐地点直接写食堂。绕路就免了。'],
        ['hero', '这次地点和时间都明确了。'],
        ['cook', '好。别让最晚休息的人，再为了找一碗饭跑遍全镇。'],
      ]),
    ]),
    job('veterans_table', '凯旋后没有庆功单', 45, 'crown', 'quartermaster', '通关晨星边境后筹备一顿平常的饭，让归队的人自己决定怎样庆祝', [
      questDialogue('returning', 'quartermaster', '与雷恩讨论归队后的安排', [
        ['quartermaster', '我写了三页庆功流程，莉娅问我：他们是不是只想先坐下？'],
        ['hero', '也许每个人想要的不同。'],
        ['quartermaster', '你通关晨星边境后去问米洛。我先把流程放一边，听一次真正归来的人。'],
      ]),
      questEvent('border_win', 'win', 1, '完整通关第 1 幕晨星边境', { act: 1 }),
      questDialogue('return_supper', 'cook', '请米洛安排归队后的晚餐', [
        ['cook', '先吃饭，想讲见闻的人讲，想安静的人安静。锅不会问谁拿了最多战果。'],
        ['hero', '雷恩准备了很长的庆功流程。'],
        ['cook', '叫他一起来，给那三页纸也放一双筷子，看它能不能吃。'],
      ]),
      questDialogue('return_table', 'quartermaster', '把归队晚餐安排告诉雷恩', [
        ['narrator', '米洛和莉娅来到军需处，雷恩把庆功流程折好收进柜子。'],
        ['guild', '公会只做必要登记，剩下的时间还给回来的人。'],
        ['cook', '你的座位也留了，雷恩。别一转身又去清点空箱子。'],
        ['quartermaster', '好。这次我先坐下。平安归来已经够值得庆祝，不用再排一次队证明。'],
        ['hero', '那三页流程以后呢？'],
        ['quartermaster', '留给桌角垫平。总算也派上用场。'],
      ], '军需处 · 归队晚餐'),
    ]),

    // 米洛：一口锅连着道路、归途和很多不好意思开口的人。
    job('different_spoons', '不是每个人都吃同一锅', 25, 'food', 'cook', '依次确认暖胃与轻盈餐，讨论不同人的整备需要', [
      questEvent('hearty', 'meal', 1, '到米洛处先预订暖胃炖汤', { id: 'hearty' }),
      questDialogue('different_needs', 'cook', '向米洛了解不同餐食的整备作用', [
        ['cook', '暖胃汤给生命留余量，轻盈餐照顾脚步。不能看谁碗大，就说谁受优待。'],
        ['hero', '我再看看另一份。'],
        ['cook', '可以，预订会替换。这里不是让你把两份一起带走的比赛。'],
      ]),
      questEvent('swift', 'meal', 1, '再到米洛处预订轻盈餐（替换前一份）', { id: 'swift' }),
      questDialogue('meal_choice', 'cook', '和米洛确认两次餐食选择的区别', [
        ['cook', '现在预订的是轻盈餐。选择变了，记录也要变，不然雷恩又以为谁都能多带一锅。'],
        ['hero', '最好不如适合。'],
        ['cook', '这话给我写在门口，省得每天被问哪份最厉害。'],
      ]),
    ]),
    job('flour_count', '半袋面粉算不算一袋', 20, 'coin', 'cook', '核对告示里的计量方式，让食堂与军需不再为同一袋粮争论', [
      questInspect('measure', 'board', '检查公会告示板的食粮计量', [
        ['narrator', '一份通知按袋计数，另一份按足量袋登记。两边的数字看似对不上。'],
        ['hero', '半袋在一边算一袋，在另一边却只算一半。'],
        ['narrator', '你把不同计量写在一起，准备向食堂核对。'],
      ], '公会告示板 · 食粮计量'),
      questDialogue('flour', 'cook', '向米洛确认食堂真正使用的粮量', [
        ['cook', '我算能做多少饭，不算柜子里放了几个袋子。米和面还不能混在一列。'],
        ['hero', '军需用袋数做搬运记录。'],
        ['cook', '那两种都留着，但标明用途。请雷恩别把搬得动多少写成能吃多少。'],
      ]),
      questDialogue('two_counts', 'quartermaster', '与雷恩核对搬运和食用的两种计量', [
        ['quartermaster', '对，袋数看装载，实际粮量看供餐。我把两栏分开，不再让米洛对着空袋子配菜单。'],
        ['hero', '不是谁的账错了，是各自在算不同的事。'],
        ['quartermaster', '弄清这一点，比争到一个人认错有用。'],
      ]),
    ]),
    job('frost_lunch', '不会冻住的午饭安排', 30, 'food', 'cook', '预订暖胃餐并查访霜原商店，为寒地行程安排补给间隔', [
      questEvent('warm_lunch', 'meal', 1, '到米洛处预订暖胃炖汤', { id: 'hearty' }),
      questEvent('lunch_stop', 'visit', 1, '进入第 2 幕霜原的旅行商店', { act: 2, type: 'shop' }),
      questDialogue('lunch_report', 'cook', '向米洛报告霜原的补给停留点', [
        ['cook', '有地方停，就能把休息安排进去。午饭不该等到所有事做完才想起来。'],
        ['hero', '霜原的路线比镇里远。'],
        ['cook', '远才要按段想。出发前的一碗汤，不能替人吃掉整条路。'],
      ]),
    ]),
    job('swamp_bread', '潮气里的干粮', 30, 'boots', 'cook', '预订轻盈餐并确认腐沼神殿路线，讨论怎样安排能停下的行程', [
      questEvent('light_pack', 'meal', 1, '到米洛处预订轻盈餐', { id: 'swift' }),
      questEvent('dry_stop', 'visit', 1, '进入第 3 幕腐沼的属性神殿房', { act: 3, type: 'shrine' }),
      questDialogue('bread_review', 'cook', '向米洛确认腐沼途中的停留路线', [
        ['cook', '你能确认的只有神殿位置，那我们就写位置，不把它写成一定干燥舒适的食堂。'],
        ['hero', '轻盈餐让我多一点行动余地。'],
        ['cook', '也把余地用来休息。跑得快，不等于一定要把饭吃得更急。'],
      ]),
    ]),
    job('desert_water', '一杯水之外', 35, 'heart', 'cook', '在黄沙受伤时实际使用生命之泉，再报告泉水的真实作用', [
      questDialogue('water_question', 'cook', '听米洛说明黄沙泉水的核对要求', [
        ['cook', '有人把生命之泉写成“万能水”。名字好听，可实际能做什么得说清楚。'],
        ['hero', '需要确认它恢复伤势？'],
        ['cook', '是。只有受伤时本来需要用泉，再记这一次。不要为了我的便条刻意弄伤自己。'],
      ]),
      questEvent('real_heal', 'heal', 1, '在第 4 幕黄沙受伤时使用生命之泉，实际回复生命', { act: 4, source: 'fountain' }),
      questDialogue('water_answer', 'cook', '向米洛报告黄沙生命之泉的实际恢复', [
        ['cook', '能恢复伤势，这项写清楚。除此之外没核对的，不靠一个“万能”补上。'],
        ['hero', '路线和使用效果是两份不同的记录。'],
        ['cook', '对。口渴的人、受伤的人、找休息地的人，需要的是不同答案。'],
      ]),
    ]),
    job('cloud_tea', '云端归来的茶客', 40, 'book', 'cook', '查访天穹商店，将沿途见闻变成食堂能读给大家听的记录', [
      questDialogue('tea_request', 'cook', '听米洛说明食堂的新茶桌', [
        ['cook', '远征回来的人总被问战果。我想留一张桌子，听听路上普通的事。'],
        ['hero', '比如天穹的商店？'],
        ['cook', '正好。查访之后请诺拉帮忙记，别让故事最后只剩谁打赢了谁。'],
      ]),
      questEvent('cloud_shop', 'visit', 1, '进入第 5 幕天穹的旅行商店', { act: 5, type: 'shop' }),
      questDialogue('travel_story', 'archivist', '请诺拉整理天穹途中的停留见闻', [
        ['archivist', '旅行商店这样的地点，让远方像有人生活过的地方。我要把它放在战斗记录之外。'],
        ['hero', '米洛想在茶桌上念。'],
        ['archivist', '那我写得明白些，不把一杯茶读成一份军械报告。'],
      ]),
      questDialogue('tea_table', 'cook', '将诺拉整理的旅行见闻带回米洛处', [
        ['cook', '这段好。等你坐下，我先问“沿途在哪儿停过”，不再开口就问打了多少。'],
        ['hero', '也许有些人只想喝茶。'],
        ['cook', '那就喝茶。桌子留着，不逼每个坐下的人交一份故事。'],
      ]),
    ]),
    job('last_hot_meal', '最远的一餐也从这里开始', 45, 'food', 'cook', '预订暖胃餐并确认虚空神殿路线，讨论远征补给的边界', [
      questDialogue('far_meal', 'cook', '与米洛讨论虚空远征的餐食', [
        ['cook', '你要去最远的地方，我总忍不住想给你再添一点。可准备不能靠一口锅解决全部担心。'],
        ['hero', '先留一份暖胃餐，再确认路上停留点。'],
        ['cook', '好。我们做能做的，不把“多吃点”说成保你平安。'],
      ]),
      questEvent('last_soup', 'meal', 1, '到米洛处预订暖胃炖汤', { id: 'hearty' }),
      questEvent('void_stop', 'visit', 1, '进入第 6 幕虚空终焉的属性神殿房', { act: 6, type: 'shrine' }),
      questDialogue('far_report', 'cook', '向米洛说明虚空远征的停留路线', [
        ['cook', '停留点有记录了。剩下的判断，交给在现场的人。你不需要为了安慰我把话说满。'],
        ['hero', '我会按实际状态决定什么时候返回。'],
        ['cook', '这样最好。锅会等归来的人，不会替你催着走下去。'],
      ]),
    ]),
    job('lost_recipe', '菜谱里没有的一勺', 25, 'book', 'cook', '核对旧菜谱中的口头习惯，让档案保留做饭人的经验', [
      questDialogue('recipe', 'cook', '听米洛说明旧菜谱的空缺', [
        ['cook', '旧菜谱写“照往常放”，往常的人却不在这里了。我不想假装自己知道那一勺有多大。'],
        ['hero', '去找诺拉看有没有旁注？'],
        ['cook', '谢谢。查到多少说多少，别为了把菜谱补齐编一个漂亮故事。'],
      ]),
      questDialogue('recipe_archive', 'archivist', '请诺拉核对旧菜谱中的旁注', [
        ['archivist', '只有一句“尝过再加”，没有固定份量。这是提醒人判断，不是一条遗失的数字。'],
        ['hero', '米洛怕自己把旧味道做错。'],
        ['archivist', '我跟你去告诉他。传承不一定要求每一勺都像同一个人。'],
      ]),
      questDialogue('recipe_table', 'cook', '与米洛、诺拉和艾琳讨论旧菜谱', [
        ['narrator', '诺拉带着旁注来到食堂，艾琳也听到这场关于“往常”的讨论。'],
        ['archivist', '原注只说尝过再加，没有要求固定份量。空白我会保留。'],
        ['mentor', '老师也常这么教：先感觉，再判断。把经验写成数字，会丢掉一半意思。'],
        ['cook', '那我可以做今天适合大家的味道，不必每天追一口不存在的原样。'],
        ['hero', '旧菜谱终于像能继续用的东西了。'],
      ], '食堂 · 旧菜谱会读'),
    ]),
    job('workshop_lunch', '打铁的人也该停筷', 30, 'food', 'cook', '核对真实整备开支，再和工坊谈一顿不在炉边匆忙吃完的饭', [
      questDialogue('lunch_time', 'cook', '听米洛讲工坊总退回来的饭碗', [
        ['cook', '布洛克的碗总剩一半，他说等炉火降下来再吃。降下来时，饭早凉了。'],
        ['hero', '他觉得停下会耽误交付。'],
        ['cook', '你看看路上实际整备的花费，再跟他谈。活人不该永远给订单的时间让路。'],
      ]),
      questEvent('equipment_cost', 'goldspend', 100, '在地牢商店 / 神殿实际消费 100 金币'),
      questDialogue('smith_lunch', 'smith', '与布洛克讨论工坊的午饭时间', [
        ['smith', '我知道饭该热着吃。就是一看到还没冷却的成品，心里又想等一等。'],
        ['hero', '米洛愿意按工坊能停炉的时段安排，不是让你在最忙时硬离开。'],
        ['smith', '那就提前约个时段。我去食堂吃，别再把碗搁在炭灰旁边。'],
      ]),
      questDialogue('lunch_booking', 'cook', '向米洛确认工坊的午饭安排', [
        ['cook', '提前约好就行。照顾一个人，不必总变成追着他跑。'],
        ['hero', '这次他答应来食堂。'],
        ['cook', '那我把碗放桌上，不放门口。希望他先看见一把能坐下的椅子。'],
      ]),
    ]),
    job('lucky_recipe', '好运不是配方', 25, 'clover', 'cook', '预订幸运餐并记录一件新装备，与厨师分清好运和保证', [
      questEvent('lucky_meal', 'meal', 1, '到米洛处预订幸运餐', { id: 'lucky' }),
      questEvent('new_equipment', 'discover', 1, '发现 1 件新装备（图鉴全收集可直接核对）'),
      questDialogue('luck_review', 'cook', '和米洛讨论幸运餐与装备见闻', [
        ['cook', '发现新东西是好消息，可别把这件事全算在我的锅上。幸运餐也没有许诺一定出什么。'],
        ['hero', '那名字为什么叫幸运餐？'],
        ['cook', '给出发留一点好心情，也有明确的宝箱加成。加成写加成，保证我可不写。'],
      ]),
    ]),

    // 诺拉：把证据、传闻和人的声音分开，仍放在同一份历史里。
    job('margin_voices', '页边的小小争论', 20, 'book', 'archivist', '向导师核对旧笔记的反对意见，让档案保留不同声音', [
      questDialogue('margin', 'archivist', '听诺拉说明页边的反对意见', [
        ['archivist', '这页正文说“全员赞成”，页边却有人写了“不”。我不想因为字小，就当它没存在过。'],
        ['hero', '艾琳也许知道这类课堂笔记。'],
        ['archivist', '请问她，保留原文与说明有没有更合适的办法。不是请她替过去决定谁对。'],
      ]),
      questDialogue('dissent', 'mentor', '与艾琳讨论课堂笔记中的分歧', [
        ['mentor', '老师鼓励把不同意见写在页边。正文常是结论，页边才看得出结论怎么来的。'],
        ['hero', '诺拉想知道该怎么登记。'],
        ['mentor', '两者都留。别用多数人的一句话，把一个曾认真思考的人涂掉。'],
      ]),
      questDialogue('both_records', 'archivist', '把艾琳的建议交给诺拉', [
        ['archivist', '我标成“正文记述”与“页边异议”，不擅自合成一份没有分歧的版本。'],
        ['hero', '读起来会更复杂。'],
        ['archivist', '历史里的生活本来就复杂。清楚地呈现，不等于把它削平。'],
      ]),
    ]),
    job('living_dates', '碑上的年份，镇里的今天', 25, 'feather', 'archivist', '核对英灵碑纪年，再确认公会怎样说明仍未结束的寻找', [
      questInspect('dates', 'stele', '在英灵碑核对失踪记录的年份与备注', [
        ['narrator', '年份很明确，结局却留有待核定的注记。'],
        ['hero', '时间过去了，不代表每个问题都已经有了答案。'],
        ['narrator', '你分别抄下日期与注记，没有把它们合成一个确定的结局。'],
      ], '英灵碑 · 日期核对'),
      questDialogue('date_record', 'archivist', '与诺拉核对碑文中的日期和结论', [
        ['archivist', '日期能确定，去向不能。我们要让读者看得出这两种确定程度。'],
        ['hero', '公会的寻找通知也应该一样。'],
        ['archivist', '请和莉娅确认。我不想档案留着待查，告示却已经让人以为没有希望也没有疑问。'],
      ]),
      questDialogue('notice_status', 'guild', '与莉娅核对寻找通知的状态', [
        ['guild', '通知会写“持续查证”，再列出已经核对的线索。不把没查清的空白写成承诺。'],
        ['hero', '等的人需要知道真实进展。'],
        ['guild', '是。让他们一直猜，是公会最不该留下的工作。'],
      ]),
    ]),
    job('frost_erasure', '雪擦不掉的旁注', 35, 'book', 'archivist', '确认霜原神殿路线，并共同核对过时的行程说明', [
      questDialogue('old_route', 'archivist', '向诺拉领取霜原旧行程的核对项', [
        ['archivist', '旧说明只画了一条直路，没标神殿。我想知道这是当年没记录，还是后来才有。'],
        ['hero', '我能确认如今的路线，但不能证明当年发生过什么。'],
        ['archivist', '正好。先确认如今，旧事另查，不把两份记录强行对成一张。'],
      ]),
      questEvent('frost_shrine', 'visit', 1, '进入第 2 幕霜原的属性神殿房', { act: 2, type: 'shrine' }),
      questDialogue('frost_compare', 'archivist', '与诺拉、雷恩和艾琳核对霜原路线说明', [
        ['narrator', '雷恩和艾琳来到档案室，诺拉把新旧路线并排放好。'],
        ['quartermaster', '新整备表按现在能确认的神殿写，不能沿用一条没有休息点的直线。'],
        ['mentor', '旧图留下，别把我们的观察写成它从前就错。'],
        ['archivist', '我分别注明年代和来源。让后来人知道路线记录会更新，不是永远完整。'],
        ['hero', '我们改的是现在的使用说明，不替过去补一个没有证据的答案。'],
      ], '档案室 · 霜原路线对读'),
    ]),
    job('swamp_catalogue', '菌毯之外的见闻', 35, 'eye', 'archivist', '新增装备记录，也把旅途里的普通停留经验带回食堂', [
      questDialogue('catalogue', 'archivist', '与诺拉讨论装备记录之外的见闻', [
        ['archivist', '腐沼的报告常只有毒物和怪物。读完仿佛没有人曾在那里停下来。'],
        ['hero', '装备图鉴能补一点？'],
        ['archivist', '先新增三件装备记录，再听米洛怎么整理行人的停留需求。两种资料都留，不混成一份。'],
      ]),
      questEvent('discoveries', 'discover', 3, '发现 3 件新装备（图鉴全收集可直接核对）'),
      questDialogue('ordinary_travel', 'cook', '向米洛了解旅人常问的补给问题', [
        ['cook', '最多的人问：哪儿能停、什么时候吃、回来还有没有热饭。比谁最厉害实在得多。'],
        ['hero', '诺拉想把普通行人的需求也留下。'],
        ['cook', '那就把这些原话带回去。别润色成一句听起来很伟大的远征誓言。'],
      ]),
      questDialogue('ordinary_record', 'archivist', '向诺拉补充装备与行人需求的两份记录', [
        ['archivist', '装备按图鉴记录，行人的话放在生活见闻。不是所有东西都要变成战斗数据才有价值。'],
        ['hero', '有人只想知道回来还能不能吃上饭。'],
        ['archivist', '这句很好。我照原样写，让后来的人听得出有人说过它。'],
      ]),
    ]),
    job('desert_altar_name', '古墓里的祭坛名称', 35, 'gem', 'archivist', '只调查黄沙祭坛所在的房间，分清看到地点与实际交换的记录', [
      questDialogue('altar_name', 'archivist', '听诺拉说明黄沙祭坛档案的歧义', [
        ['archivist', '旧记录写“抵达祭坛”，有人却把它读成“完成献祭”。两个行为不能混在一起。'],
        ['hero', '这次只核对房间路线。'],
        ['archivist', '对。不要求你交换生命，找到所在房间，再把记录的用词改清楚。'],
      ]),
      questEvent('altar_location', 'visit', 1, '进入第 4 幕黄沙的生命祭坛房（无需献祭）', { act: 4, type: 'altar' }),
      questDialogue('altar_wording', 'archivist', '与诺拉核对祭坛地点的记录用词', [
        ['archivist', '这项标“路线确认”，不是“交换完成”。名称接近，证据却不同。'],
        ['hero', '一处地点不会自动说明人在那里做了什么。'],
        ['archivist', '是。档案里最容易出错的，往往是人以为不用写清楚的那一步。'],
      ]),
    ]),
    job('sky_mechanism', '云端的工艺目录', 45, 'hammer', 'archivist', '以五份已有图纸和天穹神殿路线补充工艺分类', [
      questOwned('blueprints', 'blueprint', 5, '拥有 5 张已解锁的装备图纸（已有图纸计入）'),
      questDialogue('mechanism_index', 'archivist', '与诺拉讨论天穹工艺目录', [
        ['archivist', '目录把发光的东西全放在“符文”下面。可有些是机关，有些只是导流结构。'],
        ['hero', '先看神殿路线，再问布洛克如何分类。'],
        ['archivist', '好。你已有的图纸也能用来比较，不需要为目录再买一遍知识。'],
      ]),
      questEvent('sky_index', 'visit', 1, '进入第 5 幕天穹的属性神殿房', { act: 5, type: 'shrine' }),
      questDialogue('craft_terms', 'smith', '请布洛克核对云端工艺目录的分类', [
        ['smith', '先按作用分，再按结构注明。发不发光，不是区分机关和符文的好办法。'],
        ['hero', '诺拉会把能确认和待研究的分开。'],
        ['smith', '很好。工艺目录不是看谁能最快给陌生东西起名。'],
      ]),
    ]),
    job('void_dispatches', '没有写满的远征页', 45, 'book', 'archivist', '清理虚空战斗房后，记录范围有限的现场报告', [
      questDialogue('void_page', 'archivist', '听诺拉说明虚空报告的记录要求', [
        ['archivist', '有人问能不能写“虚空已探明”。我只能回答：我们探明了走过的地方。'],
        ['hero', '给每份报告写明范围。'],
        ['archivist', '请再清理五间虚空战斗房，回来按实际见闻报。不用为了把一页写满，就把猜测补进去。'],
      ]),
      questEvent('void_range', 'clear', 5, '清理第 6 幕虚空终焉的 5 间战斗房', { act: 6 }),
      questDialogue('range_record', 'archivist', '向诺拉提交限定范围的虚空报告', [
        ['archivist', '这份记为本次所经房间，不扩大成整个虚空的结论。空白处继续留待查。'],
        ['hero', '看起来还没有完成。'],
        ['archivist', '记录得准确，就是完成了这份报告。世界不必也跟着完成。'],
      ]),
    ]),
    job('copied_directions', '同一个箭头，不同的路', 25, 'boots', 'archivist', '比较公会告示和法阵上的方向记号，避免通用符号被误读', [
      questInspect('board_arrow', 'board', '在公会告示板核对路线箭头的说明', [
        ['narrator', '告示中的箭头表示往下一处地点走，没有标注比例。'],
        ['hero', '图上的长短，不等于路上的距离。'],
        ['narrator', '你把箭头旁的说明抄下，准备再看法阵的同类记号。'],
      ], '公会告示板 · 方向说明'),
      questInspect('portal_arrow', 'portal', '在出征法阵核对导流箭头的用途', [
        ['narrator', '法阵上的箭头沿槽纹绕行，指示力量回流，不是行人前进的方向。'],
        ['hero', '同一个形状，在不同地方说的是不同事情。'],
        ['narrator', '你将两处用途分开记，没有把相同符号当成相同指令。'],
      ], '出征法阵 · 导流记号'),
      questDialogue('symbol_note', 'archivist', '请诺拉给两种方向记号补充用途说明', [
        ['archivist', '图例要写用途。读懂符号，不只是认得它的形状。'],
        ['hero', '告示指人走，法阵指力量流。'],
        ['archivist', '这两句直接写进去。清楚的说明，不必显得比生活更高深。'],
      ]),
    ]),
    job('talent_notes', '学过，不等于同一种学法', 35, 'book', 'archivist', '核对十级已有天赋，并为不同学习路线保留独立说明', [
      questOwned('talent_record', 'talent', 10, '累计习得 10 级天赋（已有等级计入）'),
      questDialogue('route_question', 'mentor', '和艾琳讨论不同天赋路线的学习方式', [
        ['mentor', '同样十级本领，可以是两条很不同的路。别把总数写成同一份毕业证明。'],
        ['hero', '诺拉想完善学习记录。'],
        ['mentor', '请她保留路线与用途。数字方便检索，人不能只被数字介绍。'],
      ]),
      questDialogue('route_archive', 'archivist', '向诺拉交付不同学习路线的说明', [
        ['archivist', '等级是数量，路线是选择，实际用途是经验。三项分开，后来人就不会以为只有一种学法。'],
        ['hero', '这样记录要花更多时间。'],
        ['archivist', '值得。档案如果让人看不见自己的选择，就只剩一个整齐的名册。'],
      ]),
    ]),
    job('living_pages', '写进晨星镇的人', 40, 'feather', 'archivist', '核对已有装备见闻，再让六名居民把自己的日常写进地方志', [
      questOwned('catalogue_record', 'discover', 15, '图鉴已记录 15 件装备（已有记录计入）'),
      questDialogue('town_chronicle', 'archivist', '参加诺拉召集的晨星镇地方志会谈', [
        ['narrator', '诺拉请莉娅、艾琳、布洛克、雷恩和米洛到档案室，每个人面前都有一页空纸。'],
        ['archivist', '装备和远征都有记录了。这一页我想请大家写普通的一天，不只写危机。'],
        ['guild', '那我写登记册里的问路，也写后来补上的休息日。'],
        ['smith', '我写停炉检查。看起来没做成东西的半天，也是在让工坊继续开下去。'],
        ['quartermaster', '我写交接表如何改清楚。最好能让后来的人少绕几趟夜路。'],
        ['cook', '我写第一锅汤怎么热、最后一碗怎么留。还得写锅旁边的人是谁。'],
        ['mentor', '我写学生怎样提出疑问，也写老师承认不知道的时候。'],
        ['hero', '这本地方志，会比一张战果表厚很多。'],
        ['archivist', '镇子本来就比战果大。谢谢你们，让纸上的晨星也有人住着。'],
      ], '档案室 · 六人地方志会谈'),
    ]),
  ];
}
