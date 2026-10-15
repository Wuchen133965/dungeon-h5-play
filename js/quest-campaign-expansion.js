'use strict';
// Data is built after town-quests defines its objective helpers; no new world interactions are required.
function buildCampaignExpansion() {
  // Quests are grouped by story arc; the arc name is written once per group and inserted right after `name`,
  // so every quest object keeps the exact key order { id, name, arc, reward, ... } it had before.
  const campaignArc = (arc, quests) => quests.map(({ id, name, ...rest }) => ({ id, name, arc, ...rest }));
  return [
    ...campaignArc('霜原远征', [
    { id: 'expanded_frost_dispatch', name: '灯后的北方信', reward: 35, icon: 'book', lore: '归途恢复后，一封迟到的霜原商路报告把修复引向镇外。', steps: [
      questDialogue('north_letter', 'guild', '阅读莉娅收到的霜原商路报告', [
        ['guild', '归途灯稳定了，北方的消息却晚了七天。不是信使偷懒，报告上的日期每天都往后挪。'],
        ['hero', '纸上的日期也会变？'],
        ['guild', '我留了两份抄件，先别把传闻当事实。诺拉要逐字核对，雷恩要确认还能不能出发。'],
        ['guild', '我们这次去霜原，不是宣布晨星已经能修好所有地方。'],
      ]),
      questDialogue('north_copy', 'archivist', '和诺拉比对北方报告的两份抄件', [
        ['archivist', '日期不一样，字迹的转折却一样。更像两份报告抄了不同的计时来源。'],
        ['hero', '所以还没有证据说纸自己在变。'],
        ['archivist', '对。冰封湖与永冻要塞各自报时，我们以前把它们混在一栏里了。'],
        ['archivist', '先查霜原的停留点，别急着追一个会改日期的幽灵。'],
      ]),
      questInspect('north_departure', 'board', '在委托板核对霜原报告的出发与送达日期', [
        ['narrator', '你把送达戳记与商路抄件的日期并排记下。两者相差整整七天。'],
        ['hero', '送达戳记一致，只有地方报时不同。'],
        ['narrator', '你在笔记旁写下“时间来源待核”，没有划去任何一份原件。'],
      ], '公会委托板 · 北方报时'),
      questDialogue('north_route', 'quartermaster', '让雷恩为霜原远征登记核查范围', [
        ['quartermaster', '先看商店、泉眼和神殿，能停下来的人才有机会比较时间。'],
        ['hero', '要不要直接去永冻要塞？'],
        ['quartermaster', '先走得回来，再走得远。报告最急的地方，不一定是最先该去的地方。'],
        ['quartermaster', '我把范围记下了，下一步先把你的出发准备做实。'],
      ]),
    ] },
    { id: 'expanded_frost_pack', name: '一份不逞强的行囊', reward: 35, icon: 'food', lore: '北方计划中的第一处空白，是没有人负责回答“累了怎么办”。', steps: [
      questDialogue('cold_menu', 'cook', '与米洛讨论寒地行程的餐食安排', [
        ['cook', '我不会把一碗汤说成抗寒法术。它能照顾的是出发前这顿饭。'],
        ['hero', '雷恩的清单上只有武器和路线。'],
        ['cook', '那就补上休息。远征报告若只记走了多远，累倒的人就像自己做错了事。'],
        ['cook', '先选一份餐，把正常吃饭也算进准备。'],
      ]),
      questEvent('cold_meal', 'meal', 1, '在食堂预订 1 份出征餐'),
      questEvent('cold_weapon', 'starter', 1, '向军需官确认 1 次初始武器'),
      questDialogue('cold_break', 'quartermaster', '请雷恩把休息和撤回条件写入计划', [
        ['quartermaster', '米洛说得没错。我以前总把休息写在最后，最后往往没有位置。'],
        ['hero', '我们不能保证每次都走到终点。'],
        ['quartermaster', '那就记录到达的位置与撤回原因。回来报告，不算违约。'],
        ['quartermaster', '这条我亲自签，不让它只停在一张口头承诺上。'],
      ]),
    ] },
    { id: 'expanded_frost_stillwater', name: '湖面下的静刻', reward: 40, icon: 'heart', lore: '北方的泉眼仍在流动，迟缓的未必是水。', steps: [
      questDialogue('lake_question', 'mentor', '向艾琳说明霜原泉眼的核查目标', [
        ['mentor', '冰封湖的旧记录说“水行而钟止”。我们以前把它当诗。'],
        ['hero', '也可能是计时装置停了？'],
        ['mentor', '有可能，但要先看真实停留点。进入霜原的治愈泉房，记下水与回流亮光是否一致。'],
        ['mentor', '观察不用你故意受伤，也不要求把泉水带回来。'],
      ]),
      questEvent('lake_fountain', 'visit', 1, '进入 1 间霜原治愈泉房', { act: 2, type: 'fountain' }),
      questDialogue('lake_measure', 'mentor', '把霜原泉眼的观察交给艾琳', [
        ['hero', '湖面的冷光晃得人睁不开眼，泉边还能听见水声。水在流，回流亮光却像在等别处。'],
        ['mentor', '那句旧记载有实际含义。滞后来自网络，不是湖水把时间冻住了。'],
        ['hero', '我们要强行加快亮光吗？'],
        ['mentor', '先弄清它等谁。把等待的地方催快，可能只会让另一端承受更多压力。'],
      ]),
      questDialogue('lake_margin', 'archivist', '请诺拉给湖区旧记录加注', [
        ['archivist', '我保留原句，旁注写“回流信号滞后”。以后的人还能看见我们怎么理解它。'],
        ['hero', '两个计时来源可能不是谁写错了。'],
        ['archivist', '也许是两处节点都忠实记录了自己的等待。接下来要听隘口那一份。'],
      ]),
    ] },
    { id: 'expanded_frost_passage', name: '风雪里的两种急迫', reward: 45, icon: 'boots', lore: '商路需要尽快恢复，急着赶路的人与守路的人却不是同一批。', steps: [
      questDialogue('pass_council', 'guild', '参加霜原通行安排的四人会谈', [
        ['guild', '商队催我们把暴雪隘口列为可通行，粮食价格已经在涨。'],
        ['quartermaster', '我反对现在盖章。清掉眼前的敌人，不代表后续接应有人。'],
        ['cook', '再等下去也有人挨饿。我们能先公开哪些路段确认过，哪些还没有吗？'],
        ['archivist', '可以。把“已勘查”和“安全承诺”分开写，商队才能自己判断。'],
        ['guild', '雷恩，你的担心要写明；米洛，粮食缺口也一起写。不能只贴一个好看的通行印。'],
        ['hero', '我去霜原清理四间战斗房，回来报告范围，不替整条路保证。'],
      ], '公会门廊 · 北方通行会谈'),
      questEvent('pass_clear', 'clear', 4, '清理 4 间霜原战斗房', { act: 2 }),
      questDialogue('pass_return', 'quartermaster', '向雷恩交付霜原已清理路段报告', [
        ['quartermaster', '手都冻红了，先缓缓。四间房的范围很清楚，风雪里不能把没看清的路也画进去。'],
        ['hero', '还需要派更多人吗？'],
        ['quartermaster', '先把现有轮换排稳。我们缺的是持续接应，不是把更多名字塞进第一班。'],
        ['quartermaster', '我会把莉娅的通行说明附在图上。'],
      ]),
      questDialogue('pass_public', 'guild', '与莉娅确认公开的通行说明', [
        ['guild', '勘查范围、未确认地点、物价压力，都在同一页上。商队的答复比以前慢一点。'],
        ['hero', '是不是写得太复杂？'],
        ['guild', '不是。以前他们只需信我的印章，现在可以提出问题。慢一点，有时正是事情开始认真。'],
      ]),
    ] },
    { id: 'expanded_frost_crystal', name: '晶簇不肯停下', reward: 40, icon: 'gem', lore: '冰晶洞窟的回响提示：地方节点曾被要求替别人继续工作。', steps: [
      questDialogue('crystal_compare', 'smith', '听布洛克比较北方与晨星的导流工法', [
        ['smith', '霜原图样里的槽口比晨星深。不是装饰，是长期承受更多流量的磨损。'],
        ['hero', '当地的工匠知道原因吗？'],
        ['smith', '图样旁只有“代守”二字，没有期限。没人会愿意一辈子替别人加班。'],
        ['smith', '看看霜原属性神殿的符号，它们与晶簇的回响来自同一套工法。'],
      ]),
      questEvent('crystal_shrine', 'visit', 1, '进入 1 间霜原属性神殿房', { act: 2, type: 'shrine' }),
      questDialogue('crystal_rhythm', 'mentor', '和艾琳核对霜原神殿的回响', [
        ['hero', '晶光照得环纹像有两层，回响也多一拍。像要求已经完成的回应再来一次。'],
        ['mentor', '重复回应会保住外面的节拍，也会把当地拖慢。晨星的稳定也许有一部分来自这里。'],
        ['hero', '我们修好自己，却不知道谁替我们等。'],
        ['mentor', '现在知道了，就不能把它称作无关的北方问题。'],
      ]),
      questDialogue('crystal_term', 'archivist', '向诺拉追查“代守”是否设有期限', [
        ['archivist', '有期限的附页被归进杂项了：“待五路复核后解除。”并非永久服役。'],
        ['hero', '五路，就是其他几幕的地方节点？'],
        ['archivist', '还需要逐处验证，但范围对得上。我们不能只修一条路就宣布契约完成。'],
      ]),
    ] },
    { id: 'expanded_frost_fortress', name: '要塞留下的余量', reward: 55, icon: 'armor', lore: '解除过载需要先确认北方承载点仍有稳定的退路。', steps: [
      questDialogue('fortress_limit', 'mentor', '向艾琳确认霜原首领节点的验证范围', [
        ['mentor', '永冻要塞是北方链路的末端，但每位首领所在的出口都有承载痕迹。'],
        ['hero', '我们击败一位，就能解除代守吗？'],
        ['mentor', '只能验证一处出口。不要把首领败退写成当地已经同意我们的安排。'],
        ['mentor', '先打通一处霜原首领节点，回来核对铜环承压。'],
      ]),
      questEvent('fortress_boss', 'boss', 1, '击败 1 位霜原首领', { act: 2 }),
      questOwned('fortress_patterns', 'blueprint', 2, '拥有 2 张已解锁的装备图纸供工坊比较'),
      questDialogue('fortress_allowance', 'smith', '和布洛克确认北方节点的工艺余量', [
        ['smith', '你带回的出口记录与这两份槽法能对应。缓冲还能用，但不能继续当免费仓库。'],
        ['hero', '既然还能撑，其他地方会要求再等等。'],
        ['smith', '铁没断，不等于人可以一直被亏欠。我把可承受范围和必须减负一起写。'],
        ['smith', '最后要用完整霜原远征验证，不拿一场胜利冒充整条链路。'],
      ]),
    ] },
    { id: 'expanded_frost_homeward', name: '北路的完整一拍', reward: 65, icon: 'crown', lore: '完整走通北路，才能让“解除等待”有一次真实的验证。', steps: [
      questDialogue('north_full', 'guild', '登记完整霜原远征的核查条目', [
        ['guild', '这次从冰封湖走到永冻要塞，记录整幕归途。别只给我一张首领名单。'],
        ['hero', '报告里还要写什么？'],
        ['guild', '停留点、退路与回流延迟。前两项关乎沿路的人，最后一项关乎仍在代守的北方。'],
        ['guild', '通关后再来，我们把相同范围的记录放在一起。'],
      ]),
      questEvent('north_win', 'win', 1, '完整通关霜原 1 次', { act: 2 }),
      questDialogue('north_full_reading', 'mentor', '与艾琳比对完整霜原远征的回流', [
        ['mentor', '整幕记录显示延迟没有继续扩大。北方可以从无限等待改为按次复核。'],
        ['hero', '这样算修好了吗？'],
        ['mentor', '算找到一种可维持的做法。全部压力的去向还没查完，不该越过证据宣布终结。'],
      ]),
      questDialogue('north_debt', 'cook', '与米洛讨论北路恢复后的补给责任', [
        ['cook', '北路恢复，粮食会来。账上还得写我们向北路送什么，不能只记收到多少。'],
        ['hero', '食堂也要参与契约？'],
        ['cook', '契约若管不到一顿饭，挨饿的人听再多漂亮话也没用。把双向补给写给莉娅。'],
      ]),
    ] },
    { id: 'expanded_frost_accord', name: '不再替别人等', reward: 50, icon: 'feather', lore: '北方报告的七天差值成为第一条需要被公开承认的旧债。', steps: [
      questDialogue('north_accord', 'guild', '参加北方代守责任的居民会谈', [
        ['guild', '北路已验证。我想发恢复公告，但“北方为晨星争取时间”这句不能略过。'],
        ['smith', '要加上期限和维护工法。只写感谢，下一任照样可能把负担推回去。'],
        ['quartermaster', '军需账可以先列双向补给，不过我们还不确定旧压力总量。'],
        ['archivist', '不确定的写不确定，确定的欠账现在就承认。不能等查完世界才开始负责。'],
        ['cook', '我的补给条目先签。歉意也要能落到餐桌上。'],
        ['hero', '下一处我去腐沼，追查五路复核的第二份回应。'],
        ['guild', '通过。北方不再无期限代守，新的责任先从晨星这边写起。'],
      ], '公会门廊 · 北路责任会谈'),
      questInspect('north_notice', 'board', '核对委托板上北路公告的期限与责任', [
        ['narrator', '公告同时列出已核查范围、北方减负期限和晨星的双向补给责任。'],
        ['hero', '七天差值留在注释里，不再被当作地方记录出错。'],
        ['narrator', '你把核对结果记下，让公开的承诺可以在下一次复核时被找出来。'],
      ], '公会委托板 · 北路公告'),
      questDialogue('north_to_swamp', 'archivist', '向诺拉领取腐沼链路的旧注释', [
        ['archivist', '下一份回应写着“水路不可回送”，后来被人改成“水路已封”。'],
        ['hero', '不可回送和封闭不是一回事。'],
        ['archivist', '是的。一个警告被改成了结果，我们得去腐沼查它到底指什么。'],
      ]),
      questDialogue('north_lesson', 'mentor', '和艾琳复盘北方远征的判断', [
        ['mentor', '今天学到的不是怎样催快一座法阵，而是先问它为什么必须等。'],
        ['hero', '腐沼的警告可能也被我们读错了。'],
        ['mentor', '带着这个问题去。别让新答案长得太像旧命令。'],
      ]),
    ] },

    ]),
    ...campaignArc('腐沼回信', [
    { id: 'expanded_swamp_warning', name: '被涂掉的不可', reward: 35, icon: 'book', lore: '一句不能回送的警告，被抄成了一条已经封闭的好消息。', steps: [
      questDialogue('water_warning', 'archivist', '阅读诺拉保留的腐沼原文与改写', [
        ['archivist', '原文说“不可回送”，改写却说“水路已封”。墨色相近，笔顺不同。'],
        ['hero', '改写的人想让报告看起来已经解决了？'],
        ['archivist', '可能，也可能理解错了。先列出处，不替一个看不见的人断定动机。'],
        ['archivist', '雷恩的军需副本可能保留下一页。'],
      ]),
      questDialogue('water_manifest', 'quartermaster', '向雷恩核对旧水路补给清单', [
        ['quartermaster', '清单上还持续给毒沼泽送补给，说明“已封”不可能是整条路封闭。'],
        ['hero', '却没有回程货物。'],
        ['quartermaster', '也许不是无货可运，是不许把什么运回来。报告少了一栏风险来源。'],
      ]),
      questInspect('water_notice', 'board', '调查委托板上腐沼运输条目的删改', [
        ['narrator', '旧运输通知的回程一栏被横线划去，旁边只剩“免回送”三个小字。'],
        ['hero', '前两份记录都没有提它。删掉的栏目也算线索。'],
        ['narrator', '你把删改位置连同原字记下，准备交给莉娅。'],
      ], '公会委托板 · 水路副本'),
      questDialogue('water_case', 'guild', '向莉娅登记腐沼核查范围', [
        ['guild', '把回程风险藏掉，沿路的人就只能承担他们不知道的东西。'],
        ['hero', '我们先确认哪些停留点还能使用。'],
        ['guild', '对。别宣布已经找到责任人，先让现在要走那条路的人获得完整消息。'],
      ]),
    ] },
    { id: 'expanded_swamp_stops', name: '水边还有灯', reward: 40, icon: 'heart', lore: '腐沼的补给点并未消失，它们一直在承担没有写进总账的生活。', steps: [
      questDialogue('swamp_stops', 'cook', '听米洛说明腐沼停留点的调查需求', [
        ['cook', '只要补给还在往那里送，就还有人等饭。别把整片腐沼写成无人区。'],
        ['hero', '我去确认商店和泉眼。'],
        ['cook', '分别记录。可以买东西，不等于伤者有水；有水，也不等于买得到补给。'],
      ]),
      questEvent('swamp_shop', 'visit', 1, '进入 1 间腐沼商店房', { act: 3, type: 'shop' }),
      questEvent('swamp_fountain', 'visit', 1, '进入 1 间腐沼治愈泉房', { act: 3, type: 'fountain' }),
      questDialogue('swamp_stops_report', 'guild', '向莉娅交付腐沼两类停留点记录', [
        ['hero', '泥水带着菌味，可商店和泉边仍有人停留。那里没有被一条横线划成空地。'],
        ['guild', '我把“水路已封”撤下。送粮的人若只读到这四个字，恐怕真会以为不必再去。'],
        ['guild', '错过的日子不能靠新公告补回来，但不能继续让他们白等。'],
      ]),
    ] },
    { id: 'expanded_swamp_mycelium', name: '菌毯替谁记账', reward: 45, icon: 'gem', lore: '腐沼的地方环纹记录了承载，也记录了总账没有承认的损耗。', steps: [
      questDialogue('mycelium_trace', 'mentor', '向艾琳了解腐沼符文的核查方法', [
        ['mentor', '菌毯森林会掩住地面痕迹，神殿环纹更容易看清完整顺序。'],
        ['hero', '要判断是不是毒水让回流变坏？'],
        ['mentor', '别先把原因归给环境。观察环纹有没有分开标注输入、回送和损耗。'],
        ['mentor', '很多系统出问题，只是因为有人不肯记第三项。'],
      ]),
      questEvent('mycelium_shrine', 'visit', 1, '进入 1 间腐沼属性神殿房', { act: 3, type: 'shrine' }),
      questDialogue('mycelium_ledger', 'archivist', '和诺拉比对腐沼损耗的记录方式', [
        ['hero', '环纹把流入记在大圈，流出记在小圈，中间还有一段没有对应记号。'],
        ['archivist', '旧总账正好也空着损耗栏。地方不是没有回送，而是没有足够力量再回送。'],
        ['hero', '总账却把它写成拒绝。'],
        ['archivist', '我先写“损耗待计”，让这个空白不能再被当成地方不合作。'],
      ]),
      questDialogue('mycelium_work', 'smith', '请布洛克估计腐沼环纹的额外磨损', [
        ['smith', '有磨损就要有人维护。有维护就有材料、人手和时间，不能全写成自然消耗。'],
        ['hero', '图样还不足以算出全部损耗。'],
        ['smith', '那就留范围，不填一个讨人喜欢的零。下一次报告拿真实情况来缩小范围。'],
      ]),
    ] },
    { id: 'expanded_swamp_crossing', name: '桥两端的账单', reward: 50, icon: 'boots', lore: '如果只追求晨星的干净回流，腐沼就会继续替所有人接住污浊。', steps: [
      questDialogue('swamp_council', 'guild', '参加腐沼回送方案的居民会谈', [
        ['guild', '把损耗算进去，晨星能收到的回流会减少。有人建议先维持原办法。'],
        ['smith', '原办法只是账面省料。腐沼的磨损不会因为我们不记录就消失。'],
        ['quartermaster', '减流会影响接应。我需要时间重排，不想拿现有队伍去冒突然断路的风险。'],
        ['cook', '时间可以约定，不能又没有期限。北方已经等过一次。'],
        ['mentor', '分段验证，先清出缓冲路段。让减流与接应一起调整，而不是逼谁立刻吞下全部代价。'],
        ['hero', '我去腐沼验证五间战斗房，再把可停留的位置交给雷恩。'],
        ['guild', '公开分段计划和复核日期。我们承认这次调整会影响晨星，也确实该影响晨星。'],
      ], '公会门廊 · 腐沼减流会谈'),
      questEvent('swamp_buffer', 'clear', 5, '清理 5 间腐沼战斗房，核对缓冲路线', { act: 3 }),
      questDialogue('swamp_relay', 'quartermaster', '向雷恩核对减流期间的接应安排', [
        ['quartermaster', '有了这五处范围，我能把接应拆成两段，不再依赖一次长距离回流。'],
        ['hero', '会比原来慢。'],
        ['quartermaster', '慢的代价由我们记下，不能让沿路的人既等更久又被写成拖延。'],
      ]),
      questDialogue('swamp_food_share', 'cook', '请米洛登记分段补给的额外开销', [
        ['cook', '多一段接应就多一顿饭，我会写进开销，不叫大家私下凑一凑。'],
        ['hero', '这点钱也要公开？'],
        ['cook', '公开不是为了嫌贵，是为了让大家看见谁在替方案付出。'],
      ]),
    ] },
    { id: 'expanded_swamp_shipwreck', name: '沉船不是沉默', reward: 40, icon: 'book', lore: '沉船墓地的断裂线索，与旧档案里一封没有被转呈的警报彼此对应。', steps: [
      questDialogue('wreck_entry', 'archivist', '阅读沉船墓地警报的转呈记录', [
        ['archivist', '警报写着“第二回送线断裂”，转呈栏却只有“暂不扰民”。'],
        ['hero', '诺拉，这次证据足够判断有人压住消息了吗？'],
        ['archivist', '足够判断没有转呈。谁签的字还模糊，我们不能越过那一步。'],
        ['archivist', '先核对腐沼宝物房的旧装置形制，看看断裂线与军械图是否相同。'],
      ]),
      questEvent('wreck_treasure', 'visit', 1, '进入 1 间腐沼宝物房', { act: 3, type: 'treasure' }),
      questDialogue('wreck_material', 'smith', '向布洛克报告腐沼旧装置的接缝', [
        ['hero', '旧环纹被潮气泡暗了，两处接缝仍能辨认。旧军械图却只画了一处。'],
        ['smith', '沉船墓地的潮气会吃掉刻痕，吃不掉本来存在的第二条线。图上少它，修理的人就只会越修越堵。'],
        ['hero', '我们不能指望靠猜把整套图补全。'],
        ['smith', '对。把“缺支路”标在图上，先阻止后来人照错图做事。'],
      ]),
      questDialogue('wreck_public', 'guild', '请莉娅公开未转呈警报的事实', [
        ['guild', '“曾收到警报，未公开；签名待查。”这样写不会给公众一个完整的坏人故事。'],
        ['hero', '但给得出已知的事实。'],
        ['guild', '那就足够现在公开。责任要继续查，警告不能再陪它一起等。'],
      ]),
    ] },
    { id: 'expanded_swamp_nest', name: '巢穴外的退路', reward: 55, icon: 'armor', lore: '腐沼的首领节点要打通，沿路居民也不能只被当作前线的背景。', steps: [
      questDialogue('nest_brief', 'quartermaster', '听雷恩说明腐沼首领节点的验证范围', [
        ['quartermaster', '血肉巢穴方向的压力最大，但先核查任一首领出口的退路。'],
        ['hero', '我要证明接应能跟上减流计划。'],
        ['quartermaster', '没错。击败一位腐沼首领，再确认已有的训练能应付紧张时的操作。'],
      ]),
      questEvent('nest_boss', 'boss', 1, '击败 1 位腐沼首领', { act: 3 }),
      questEvent('nest_practice', 'practice', 6, '回营后命中训练木桩 6 次，复盘操作'),
      questDialogue('nest_reflection', 'mentor', '和艾琳复盘腐沼退路与操作', [
        ['mentor', '你回来后仍愿意练基础，比一场胜利更能说明你没有把风险忘掉。'],
        ['hero', '操作失误很容易怪在环境上。'],
        ['mentor', '环境会影响人，但影响不能成为藏掉操作与方案问题的理由。两边都诚实记录。'],
      ]),
    ] },
    { id: 'expanded_swamp_return', name: '回信走完整条水路', reward: 65, icon: 'crown', lore: '腐沼的完整远征，将被改写过的警告重新送到愿意听见的人手里。', steps: [
      questDialogue('water_full_brief', 'guild', '登记完整腐沼远征的回流核查', [
        ['guild', '这份报告从毒沼泽到血肉巢穴，既记录节点，也记录停留的地方。'],
        ['hero', '不再把回送不足写成拒绝合作。'],
        ['guild', '也不把所有异常都解释为旧账。完整通关一次，先让现在的链路接受验证。'],
      ]),
      questEvent('water_full_win', 'win', 1, '完整通关腐沼 1 次', { act: 3 }),
      questDialogue('water_full_result', 'mentor', '向艾琳交付完整腐沼回流记录', [
        ['mentor', '分段回流能持续，损耗仍在，但已经不会被零这一栏吞掉。'],
        ['hero', '所以新方案的代价更大？'],
        ['mentor', '账面是。真实代价以前也在，只是由没有名字的地方承担。'],
      ]),
      questDialogue('water_full_archive', 'archivist', '和诺拉核对腐沼原警告的含义', [
        ['archivist', '“不可回送”是在请求减负，不是在宣布断绝往来。现在两份证据能够互相说明。'],
        ['hero', '还会有人只引用改写过的那句。'],
        ['archivist', '所以原件和改写都要展示。我们不能靠再删一次，教大家不要删改。'],
      ]),
    ] },
    { id: 'expanded_swamp_voice', name: '让警告抵达的人', reward: 50, icon: 'feather', lore: '新规则要保证一条难听的消息，也能像好消息一样抵达公会门口。', steps: [
      questDialogue('water_voice_council', 'guild', '参加警报公开与减流责任的会谈', [
        ['guild', '腐沼核查完成。有人担心公开旧压报，会让大家以后不相信公会。'],
        ['archivist', '信任不能靠让人看不见他们本该知道的东西。原件、改写、核查一起公布。'],
        ['quartermaster', '我赞成，不过接应路线不能让公告指向尚未验证的停留点。'],
        ['mentor', '那就在公告分两栏：历史事实与当前可用范围。不要用一栏的不完整压住另一栏。'],
        ['cook', '再加一条，报告坏消息的人不能因此失去补给。饿着肚子的人最容易被迫沉默。'],
        ['hero', '我们还需要查清谁拥有改写回送指令的权力。下一条线通往黄沙。'],
        ['guild', '公开并继续追查。公会先对已经发生的失职负责，不要求腐沼替我们保持体面。'],
      ], '公会门廊 · 腐沼回信会谈'),
      questInspect('water_voice_notice', 'board', '核对委托板上原警告与当前路线分栏', [
        ['narrator', '原文、删改处、核查结论并排陈列。当前路线另起一栏，不再与历史解释混在一起。'],
        ['hero', '“报送风险，不影响补给资格。”这条被放在最显眼的位置。'],
        ['narrator', '你记下公开日期，使以后送来的警报有可追查的起点。'],
      ], '公会委托板 · 腐沼回信'),
      questDialogue('water_to_sand', 'archivist', '向诺拉领取黄沙旧契约的残页线索', [
        ['archivist', '改写权来自一份黄沙契约。抄本说“五路一致同意”，原签字页却缺了一角。'],
        ['hero', '一致也可能只是记录者说的一致。'],
        ['archivist', '我们去找条件与署名。契约里最重要的，往往不在最响亮的那句话里。'],
      ]),
      questDialogue('water_sendoff', 'cook', '向米洛确认下一段远征的补给原则', [
        ['cook', '北方教我们别让别人永远等，腐沼教我们别让别人永远忍。'],
        ['hero', '黄沙会把同意说清楚吗？'],
        ['cook', '你回来告诉我。我先记住一件事：一张签字纸，不能替正在挨饿的人回答所有问题。'],
      ]),
    ] },
    ]),
    ...campaignArc('黄沙契约', [
    { id: 'expanded_sand_clause', name: '同意后面的半行字', reward: 35, icon: 'book', lore: '黄沙抄本的大字写着一致同意，小字却留下了暂借和复核。', steps: [
      questDialogue('sand_clause', 'archivist', '阅读黄沙契约残页的小字条款', [
        ['archivist', '“五路一致同意”后还有半行：“暂借回流，三次复核后续议。”总账没抄。'],
        ['hero', '条件被拿走，同意就变成了永久命令。'],
        ['archivist', '是。还要确认残页没有脱离原文，不能拿它简单推翻另一份抄本。'],
        ['archivist', '去问布洛克，那种年代的署记通常刻在什么材料上。'],
      ]),
      questDialogue('sand_seal', 'smith', '向布洛克核对旧契约署记的工法', [
        ['smith', '黄沙的公共约定常刻在耐磨边框上。边角最费工，条件反而最难被完整抄下来。'],
        ['hero', '所以缺角可能没有恶意？'],
        ['smith', '缺角本身不能说明恶意。拿缺角的东西当完整命令，才是必须追问的选择。'],
      ]),
      questInspect('sand_transcript', 'board', '在委托板比较黄沙契约抄本与残页范围', [
        ['narrator', '你按行距把残页的位置标到抄本旁，条件恰好落在缺失的下边角。'],
        ['hero', '这份抄本应该叫节录，不能再叫全文。'],
        ['narrator', '你把缺失范围记下，没有擅自补出尚未读到的签名。'],
      ], '公会委托板 · 契约节录'),
      questDialogue('sand_scope', 'guild', '与莉娅登记黄沙契约核查的问题', [
        ['guild', '父亲以前走沙路，归来总先擦掉鞋底的砂。他说别把远方带给家的负担藏进地毯里。'],
        ['hero', '你现在想起这句话，是因为那张缺角的契约？'],
        ['guild', '是。我给节录盖过公会印，觉得前人已经决定好了。今天才认真看见被藏掉的条件。'],
        ['guild', '我们查谁同意、同意多久、怎么退出。不能把遗留下来的负担当成家里本来就该有的砂。'],
      ]),
    ] },
    { id: 'expanded_sand_caravan', name: '沙路不是一条直线', reward: 40, icon: 'boots', lore: '黄沙的补给路线提醒晨星：抵达目的地与沿途得到照顾是两回事。', steps: [
      questDialogue('sand_route_brief', 'quartermaster', '听雷恩说明黄沙停留点的核查顺序', [
        ['quartermaster', '流沙荒漠、法老陵墓、烈日绿洲、镜之神殿，距离不是唯一的问题。'],
        ['hero', '还要查沿路有没有补给。'],
        ['quartermaster', '先确认商店，再确认泉眼。别把地图画得漂亮，却把人能撑多久留给运气。'],
      ]),
      questEvent('sand_shop_visit', 'visit', 1, '进入 1 间黄沙商店房', { act: 4, type: 'shop' }),
      questEvent('sand_water_visit', 'visit', 1, '进入 1 间黄沙治愈泉房', { act: 4, type: 'fountain' }),
      questDialogue('sand_route_food', 'cook', '与米洛核对黄沙停留点记录', [
        ['cook', '分开的两份记录我收好了。以后不再用一句“绿洲可补给”替整条沙路做保证。'],
        ['hero', '听起来我们一直在把一句话拆成几句话。'],
        ['cook', '因为一句话太方便，往往方便的是写话的人。走路的人需要知道具体在哪儿能停。'],
      ]),
    ] },
    { id: 'expanded_sand_tomb', name: '陵墓中的续议', reward: 45, icon: 'gem', lore: '旧契约为续议保留了位置，后来的抄写却把空白叫成了默许。', steps: [
      questDialogue('sand_tomb_brief', 'archivist', '听诺拉说明黄沙旧环纹的署记位置', [
        ['archivist', '法老陵墓的旧契约与神殿使用同一套边框记号。看小圈，别只看中心的大字。'],
        ['hero', '我要找到有没有复核的痕迹。'],
        ['archivist', '对。一次签署不等于后面的所有续议都已经发生。'],
      ]),
      questEvent('sand_shrine_record', 'visit', 1, '进入 1 间黄沙属性神殿房核对环纹', { act: 4, type: 'shrine' }),
      questDialogue('sand_empty_vote', 'mentor', '和艾琳核对黄沙环纹上的空位', [
        ['hero', '大圈完整，旁边三个复核小圈只有第一个留着回应纹。'],
        ['mentor', '后两次没有收到回应。小时候老师问要不要继续练，我不敢回答，他便让我又练了一晚。'],
        ['hero', '你其实想停下？'],
        ['mentor', '想，却怕让他失望。后来我当导师，也差点把学生的沉默当成乐意。空位要保留，别替它说话。'],
      ]),
      questDialogue('sand_empty_note', 'archivist', '让诺拉记录复核回应的缺失', [
        ['archivist', '已知第一次有回应，后两次未证实。这个结论没有口号那么好记，却更准确。'],
        ['hero', '我们还需要当年的退出条款。'],
        ['archivist', '正是。没有退出的续议，不会给拒绝的人留下真正的路。'],
      ]),
    ] },
    { id: 'expanded_sand_consent', name: '沉默不能替人签名', reward: 50, icon: 'feather', lore: '居民必须决定是否暂停有利于晨星、却缺少复核回应的旧条款。', steps: [
      questDialogue('sand_consent_council', 'guild', '参加黄沙旧条款效力的居民会谈', [
        ['guild', '后两次回应未证实。维持旧条款最方便，暂停则要重排回流。'],
        ['quartermaster', '接应不能一夜之间重排。我反对没有准备地停，但也反对拿准备当无限延期。'],
        ['mentor', '先不增加负担，只验证已有范围。等退出条款核查完，再讨论新的分配。'],
        ['smith', '旧铜环能维持现有范围。把“不增加”写进维护单，我不接偷偷扩槽的活。'],
        ['archivist', '同时把缺回应的两次复核公开。暂停增量不代表承认旧条款永远有效。'],
        ['hero', '我先在黄沙清理六间战斗房，验证接应路线，不扩大承载范围。'],
        ['guild', '按这个方案执行。没人能再用“没有反对”替缺席的人签名。'],
      ], '公会门廊 · 契约复核会谈'),
      questEvent('sand_relay_clear', 'clear', 6, '清理 6 间黄沙战斗房，核查现有接应', { act: 4 }),
      questDialogue('sand_relay_result', 'quartermaster', '向雷恩报告黄沙现有接应范围', [
        ['quartermaster', '这几处足以支持分段接应。少承诺一些，反而能认真把承诺兑现。'],
        ['hero', '还有商队想趁现在扩大通行。'],
        ['quartermaster', '我给他们解释上限，不用一句“暂时困难”搪塞。上限写清，才不会变成看关系开口。'],
      ]),
      questDialogue('sand_boundary', 'smith', '向布洛克确认不扩大承载的维护记录', [
        ['smith', '维护单上写了修复现有槽口，不加深、不扩张。你这份范围正好附在旁边。'],
        ['hero', '工法也可以替契约守边界。'],
        ['smith', '可以，但要有人看得懂。我把尺寸写明，不让一句“稍微修大点”蒙过去。'],
      ]),
    ] },
    { id: 'expanded_sand_mirror', name: '镜面旁那句回家', reward: 45, icon: 'eye', lore: '对称边框保存了契约的先后，也藏着阿榆答应回来的一句小字。', steps: [
      questDialogue('sand_mirror_brief', 'smith', '听布洛克辨别黄沙旧记号的先后工法', [
        ['smith', '镜之神殿的对称刻法能分出先后。我老师留下过阿榆的试铸图，边角有句“回来再教下一刀”。'],
        ['hero', '我能直接看出谁刻的？'],
        ['smith', '不能。先认刀痕与顺序。那句小字我想了很多年，却怕想多了就会把别的刻字都认成他。'],
      ]),
      questEvent('sand_mirror_treasure', 'visit', 1, '进入 1 间黄沙宝物房，核对旧装置边框', { act: 4, type: 'treasure' }),
      questDialogue('sand_mirror_sequence', 'archivist', '和诺拉比对旧装置边框的增刻顺序', [
        ['hero', '“未复核则暂停”在对称边框内，“视为续行”却挤在外侧。'],
        ['archivist', '与残页的位置对应。后来解释覆盖了原条件；你抄的另一句，确实是“回来再教下一刀”。'],
        ['hero', '阿榆不只写了契约，也想过回来以后的事。'],
        ['archivist', '这句和工法相符，我们可以注明关联。签名还待核，但他的归来约定不该被“大义”两个字盖住。'],
      ]),
      questDialogue('sand_restore_clause', 'guild', '请莉娅把原始退出条件加入公告', [
        ['guild', '“未复核则暂停”恢复了。布洛克也看过那句回家约定，他坐在炉边很久没说话。'],
        ['hero', '有人一直在等他教下一刀。'],
        ['guild', '是。人们留下条件，是因为还有想回去做的事。我们不能只留下方便晨星的半张契约。'],
      ]),
    ] },
    { id: 'expanded_sand_weight', name: '不拿胜利补签', reward: 55, icon: 'skull', lore: '打通首领节点是战斗的成果，不能被挪用为地方授权的证明。', steps: [
      questDialogue('sand_boss_brief', 'mentor', '和艾琳确认黄沙首领节点的验证用途', [
        ['mentor', '击败首领能减轻出口阻碍，证明的是路线可走，不证明地方接受新条款。'],
        ['hero', '胜利很容易被公告写得比实际更大。'],
        ['mentor', '所以出发前就写清用途。先打通一位黄沙首领，再复盘你自己能控制的力量。'],
      ]),
      questEvent('sand_boss', 'boss', 1, '击败 1 位黄沙首领，验证出口节点', { act: 4 }),
      questOwned('sand_control', 'talent', 12, '累计习得 12 级天赋，复核力量控制基础'),
      questDialogue('sand_victory_limit', 'guild', '与莉娅核对黄沙首领报告的措辞', [
        ['guild', '你的袖口里还带着砂。你真正走过的出口，比我写一个威风的标题有分量。'],
        ['hero', '胜利没有替我们补出缺失的回答。'],
        ['guild', '嗯。我只写出口已经验证，剩下的继续查。你也该去洗把脸，把沙路暂时放下。'],
      ]),
    ] },
    { id: 'expanded_sand_fullroute', name: '沙海的四处回答', reward: 65, icon: 'crown', lore: '完整远征让黄沙的停留、出口和环纹记录能够在同一范围内核对。', steps: [
      questDialogue('sand_full_brief', 'quartermaster', '向雷恩登记完整黄沙远征的核查路线', [
        ['quartermaster', '这次把四个区域连起来看。零散记录容易只挑对我们有利的部分。'],
        ['hero', '到终点后，所有问题就有答案吗？'],
        ['quartermaster', '不。但完整路线能让我们知道问题遗漏在哪儿。没答案也要有位置。'],
      ]),
      questEvent('sand_full_win', 'win', 1, '完整通关黄沙 1 次', { act: 4 }),
      questDialogue('sand_full_reading', 'mentor', '与艾琳核对黄沙完整链路的边界', [
        ['mentor', '路线能维持。陵墓、烈日绿洲、镜之神殿，活着的人走过那里时，不该只背着先人的命令。'],
        ['hero', '他们也要能留下自己的回答。'],
        ['mentor', '对。首领阻断的是路，缺失的复核阻断的是选择。战斗打开了前者，我们还得认真守住后者。'],
      ]),
      questDialogue('sand_full_residents', 'cook', '向米洛说明黄沙公告中的生活条目', [
        ['cook', '补给点的记录也在正式报告里？我还以为它们又会被首领名单挤掉。'],
        ['hero', '这次各有位置。'],
        ['cook', '好。让吃饭的人和打仗的人出现在同一张纸上，纸才像是在写一段真的生活。'],
      ]),
    ] },
    { id: 'expanded_sand_covenant', name: '条件也有自己的名字', reward: 50, icon: 'book', lore: '黄沙的旧约被还原为有边界的约定，新的问题则指向天穹报时。', steps: [
      questDialogue('sand_covenant_council', 'guild', '参加黄沙原契约恢复与复核的会谈', [
        ['guild', '原条款与增刻顺序都已核对。我们恢复“未复核则暂停”，并公开晨星得到过什么。'],
        ['quartermaster', '现有接应按上限维持，下一次扩展必须有新的回应，不能自动续行。'],
        ['smith', '维护图与上限对应。我把不允许扩槽的原因写在图首，免得后来人当成手艺不够。'],
        ['archivist', '两次缺失回应的责任还没查完。恢复条件，不能顺手替那段历史结案。'],
        ['cook', '后面开会别只请能提供力量的人，补给与停留也得有发言位置。'],
        ['hero', '下一站天穹。我要查报时档案里，谁把缺失回应写成了已收到。'],
        ['guild', '记录。今天我们不宣布所有人一致，只写各自明确同意的范围。'],
      ], '公会门廊 · 黄沙原约会谈'),
      questInspect('sand_covenant_notice', 'board', '核对黄沙公告中的有效条件与待查责任', [
        ['narrator', '公告把期限、复核与暂停条款列在同一页，待查的历史责任单独保留。'],
        ['hero', '这里没有替缺席的人写“全体同意”。'],
        ['narrator', '你记下今日居民实际确认的条目，留给以后的复核逐项核对。'],
      ], '公会委托板 · 有边界的约定'),
      questDialogue('sand_sky_log', 'archivist', '领取诺拉找到的天穹报时矛盾', [
        ['archivist', '黄沙第二次复核没有回应，天穹却记着同一时刻收到两次确认。'],
        ['hero', '两次确认可能来自同一次旧回应。'],
        ['archivist', '需要核对来源。时钟塔与星辰观测台的格式不同，我们先别强行把数字凑成答案。'],
      ]),
      questDialogue('sand_final_note', 'mentor', '和艾琳复盘黄沙契约的边界', [
        ['mentor', '你现在知道，没有说不，不等于已经说好。胜利也不能替条件续期。'],
        ['hero', '天穹的两次确认也不能只数次数。'],
        ['mentor', '是。先问每次确认从哪里来，再问谁有权把它当成新的回答。'],
      ]),
    ] },

    ]),
    ...campaignArc('天穹校时', [
    { id: 'expanded_sky_twice', name: '只响过一次的钟', reward: 35, icon: 'eye', lore: '天穹计时档案出现两次确认，却找不到第二次回应的来源。', steps: [
      questDialogue('sky_double_log', 'archivist', '阅读诺拉整理的两次天穹确认', [
        ['archivist', '这两个记录连笔误都一样。我学抄写时，老师夸我抄得像，我就以为像意味着可靠。'],
        ['hero', '今天一样的笔误反而让你怀疑。'],
        ['archivist', '是。同一条回应可能被转发两次。我也得承认，小时候努力学会的事，并不能替我做好所有判断。'],
      ]),
      questDialogue('sky_origin', 'mentor', '向艾琳了解天穹回流的来源标记', [
        ['mentor', '浮空群岛的回流要跨多个停留点，转发很常见。原始来源应该始终保留。'],
        ['hero', '若只剩下最后接收时间呢？'],
        ['mentor', '那就无法证明有第二次回答。检查神殿环纹，别只看钟表。'],
      ]),
      questInspect('sky_reference', 'portal', '在法阵记录晨星接收端的来源刻记', [
        ['narrator', '你沿接收端查看刻记，最外圈是到达次序，内侧小纹才标记来源。'],
        ['hero', '同一来源可以出现很多次，但不因此变成很多个人的回答。'],
        ['narrator', '你把两种记号分别画下，准备作为天穹调查的对照。'],
      ], '出征法阵 · 来源对照'),
      questDialogue('sky_departure', 'quartermaster', '请雷恩登记天穹调查的对照记录', [
        ['quartermaster', '我会留一份在接应账。你回来时有同一套标记可以核对。'],
        ['hero', '不能只凭时间接近，就说消息对应。'],
        ['quartermaster', '对。以前我的调度账也犯过这个毛病，赶时间时尤其得留住来源。'],
      ]),
    ] },
    { id: 'expanded_sky_landings', name: '浮岛之间的歇脚处', reward: 40, icon: 'boots', lore: '再快的转发网络，也不能省略沿途需要停留的人。', steps: [
      questDialogue('sky_stops_brief', 'cook', '听米洛说明天穹停留点的核查内容', [
        ['cook', '浮空群岛听起来漂亮，我在补给账里看到的却是一次次延误。'],
        ['hero', '先找商店和泉眼？'],
        ['cook', '嗯。钟表能跳过几格，人不能跳过喝水与休息。分别确认，不让快报掩盖慢行。'],
      ]),
      questEvent('sky_shop', 'visit', 1, '进入 1 间天穹商店房', { act: 5, type: 'shop' }),
      questEvent('sky_fountain', 'visit', 1, '进入 1 间天穹治愈泉房', { act: 5, type: 'fountain' }),
      questDialogue('sky_stops_report', 'quartermaster', '把天穹两类停留点记录交给雷恩', [
        ['quartermaster', '脸上还带着高处的冷色，先去米洛那儿暖暖。消息能跨浮岛走得快，人却得一步步等落脚。'],
        ['hero', '那会让迟到的人看起来像没按计划走。'],
        ['quartermaster', '是。表格不能把线路的延误变成人的失职，这份记录我会附进去。'],
      ]),
    ] },
    { id: 'expanded_sky_tower', name: '雷霆传来的旧回答', reward: 45, icon: 'gem', lore: '雷霆尖塔的转发痕迹证明，收到得晚不等于回答得新。', steps: [
      questDialogue('sky_tower_brief', 'mentor', '向艾琳确认天穹神殿的来源核查方法', [
        ['mentor', '雷霆尖塔一类的节点会暂存信号。神殿环纹能区分暂存纹与原始回应纹。'],
        ['hero', '所以晚到的确认可能只是更早的回声。'],
        ['mentor', '对。进入天穹属性神殿，记录内纹与外圈，不要拿接收时间覆盖来源。'],
      ]),
      questEvent('sky_tower_shrine', 'visit', 1, '进入 1 间天穹属性神殿房', { act: 5, type: 'shrine' }),
      questDialogue('sky_tower_reading', 'mentor', '与艾琳核对天穹暂存与回应的环纹', [
        ['hero', '雷光一闪，外圈两段刻记都亮，内纹却只有一枚回应。风声盖过声音，来源还看得清。'],
        ['mentor', '支持同一条回应被重复转发。还不能确定是人为安排还是转发规则本身如此。'],
        ['hero', '无论哪种，都不足以替黄沙补上第二次复核。'],
        ['mentor', '没错。先把能证明的边界写清。'],
      ]),
      questDialogue('sky_tower_record', 'archivist', '请诺拉重分天穹确认的档案条目', [
        ['archivist', '原始回应一条，接收记录两条。次数没删，只是不再用同一个标题装它们。'],
        ['hero', '旧账上那个第二次同意怎么办？'],
        ['archivist', '标注来源不足，停止引用。记录错误也要留下修订痕迹。'],
      ]),
    ] },
    { id: 'expanded_sky_authority', name: '谁让时钟说了算', reward: 50, icon: 'book', lore: '居民需要决定：效率能否成为让一台计时规则代替众人表态的理由。', steps: [
      questDialogue('sky_authority_council', 'guild', '参加天穹转发与授权的居民会谈', [
        ['guild', '天穹的第二次确认来源不足。有人建议保留旧认定，免得每次都重问五路。'],
        ['quartermaster', '每次重问确实会慢，但我不能用调度麻烦替别人决定同意。'],
        ['mentor', '系统可以替我们送问题，不能替收信的人回答问题。把转发与授权分开。'],
        ['smith', '旧计时结构要保持可维修。别为了一个漂亮的统一数字，把地方来源磨掉。'],
        ['archivist', '我负责恢复来源栏。缺失的注明缺失，别再按时间最近自动配对。'],
        ['hero', '我先清理天穹六间战斗房，验证接应能不能承受更慢的核对。'],
        ['guild', '批准调查范围。核对更慢的代价，由我们的安排承担，不转成地方的罪名。'],
      ], '公会门廊 · 天穹授权会谈'),
      questEvent('sky_relay_clear', 'clear', 6, '清理 6 间天穹战斗房，核查分段接应', { act: 5 }),
      questDialogue('sky_relay_report', 'quartermaster', '向雷恩报告天穹分段接应范围', [
        ['quartermaster', '这些地点能分开安排接应，不必等一条覆盖整幕的即时确认。'],
        ['hero', '计划没以前那么利落。'],
        ['quartermaster', '利落的表，不该靠让真实的人配合虚假的时间。新计划会留等待范围。'],
      ]),
      questDialogue('sky_patience', 'cook', '与米洛确认核对延迟期间的补给安排', [
        ['cook', '等待会多吃几顿，这很好算。难算的是以前有人等着，却没被账本看见。'],
        ['hero', '我们这回把等待写成计划的一部分。'],
        ['cook', '那就把饭也写进去，别只给等待起一个正式名字。'],
      ]),
    ] },
    { id: 'expanded_sky_clockwork', name: '钟塔背面的工匠', reward: 45, icon: 'hammer', lore: '时钟塔的维护记号把统一报时的功劳，还给了那些不断修理它的人。', steps: [
      questDialogue('clockwork_brief', 'smith', '听布洛克说明天穹计时装置的维护记号', [
        ['smith', '我老师做过校时的零件，归来只带一张没署名的领料单。时钟照常响，没人知道那一刀是谁修的。'],
        ['hero', '背框能告诉我们什么？'],
        ['smith', '至少告诉我们它不是永远不坏。看看天穹宝物房旧装置的背框，修理者也许留下了自己的手印。'],
      ]),
      questEvent('clockwork_treasure', 'visit', 1, '进入 1 间天穹宝物房核对装置边框', { act: 5, type: 'treasure' }),
      questOwned('clockwork_patterns', 'blueprint', 4, '拥有 4 张已解锁图纸，供工坊比较通用工法'),
      questDialogue('clockwork_names', 'archivist', '和诺拉整理天穹装置的维护备注', [
        ['hero', '边框的校正痕迹有很多次，来源纹也被重新描过。'],
        ['archivist', '痕迹还在，人名却不全。小时候我喜欢的钟塔传说，说它是一位统领一夜建成的。'],
        ['hero', '真实的故事没那么像奇迹。'],
        ['archivist', '却有更多活过的人。知道名字的记名字，不知道的记职责。也让布洛克看看，他的老师不是只有一张领料单。'],
      ]),
    ] },
    { id: 'expanded_sky_observer', name: '观测者之外的证人', reward: 60, icon: 'skull', lore: '观测的结果必须允许他人复核，不能让掌管观测的人独占解释权。', steps: [
      questDialogue('sky_boss_brief', 'mentor', '听艾琳说明天穹首领出口的复核目标', [
        ['mentor', '星辰观测台的记录重要，但不是唯一的记录。每处首领出口都要能接受外部复核。'],
        ['hero', '先打通一处，再比较晨星接收端。'],
        ['mentor', '对。击败一位天穹首领，然后回镇重新检查来源纹，别让观测只剩一方能解释。'],
      ]),
      questEvent('sky_boss_node', 'boss', 1, '击败 1 位天穹首领，验证出口节点', { act: 5 }),
      questInspect('sky_receive_compare', 'portal', '在法阵比较天穹核查后的接收来源', [
        ['narrator', '你把新的出口记录与晨星接收刻记并排比对，同源的转发能逐一对应。'],
        ['hero', '两个接收时间仍在，但只有一个原始来源。'],
        ['narrator', '你写下比对方法，让下一位核查者不必只相信你的结论。'],
      ], '出征法阵 · 天穹来源复核'),
      questDialogue('sky_independent', 'guild', '与莉娅确认外部复核方法的公开范围', [
        ['guild', '方法也公开？有人会嫌它太细。'],
        ['hero', '只公开结论，就还得一直相信解释结论的人。'],
        ['guild', '有道理。把图样与比对步骤一起放入记录，不只留“经公会确认”。'],
      ]),
    ] },
    { id: 'expanded_sky_fullsong', name: '天穹没有省略的一日', reward: 65, icon: 'crown', lore: '完整走过天穹，让快到的消息与慢到的人都回到同一份真实的行程。', steps: [
      questDialogue('sky_full_brief', 'guild', '登记完整天穹远征的来源核查', [
        ['guild', '从浮空群岛到星辰观测台，这次分别记出发、停留、接收和来源。'],
        ['hero', '不再用一个时间代表全部事情。'],
        ['guild', '对。完整通关之后再核对，别用几张最清楚的片段替一整幕下结论。'],
      ]),
      questEvent('sky_full_win', 'win', 1, '完整通关天穹 1 次', { act: 5 }),
      questDialogue('sky_full_record', 'archivist', '向诺拉交付完整天穹行程与来源记录', [
        ['archivist', '四个区域的来源能对应了。钟塔传说还是好听，可我现在更想知道那些校时的人怎样回家。'],
        ['hero', '黄沙的第二次回答并没有因为传说好听而出现。'],
        ['archivist', '对。转发不能填缺席，传奇不能填失踪。最后那条维护命令通往虚空终焉，第七队的留白还在那里。'],
      ]),
      questDialogue('sky_full_endurance', 'cook', '和米洛核对天穹行程里的等待记录', [
        ['cook', '从钟塔回来的人，耳朵里是不是还响着节拍？我给你找个安静位置。'],
        ['hero', '等接应时，总觉得每一拍都比上面慢。'],
        ['cook', '那就先不数了。报告里的等待我留着，饭桌上的这一段，你不必证明自己做了什么。'],
      ]),
    ] },
    { id: 'expanded_sky_commonclock', name: '时钟旁的第二本账', reward: 50, icon: 'book', lore: '新的报时记录旁，放上一份任何居民都能核对的来源账。', steps: [
      questDialogue('sky_common_council', 'guild', '参加公开报时与来源账的居民会谈', [
        ['guild', '天穹来源已核对。以后公会收确认，要同时保留原始来源和转发次数。'],
        ['quartermaster', '我负责到达时间，诺拉负责来源。两边不一致就标待核，不自动改成一致。'],
        ['archivist', '复核方法放在旁边，居民可以指出问题，不能只有登记员看得懂。'],
        ['smith', '维护刻记也留存。不然下次修过时钟，来源又会从新账里掉出去。'],
        ['mentor', '还要允许确认撤回。一个昨日的回答，不能永远替今日的人说话。'],
        ['hero', '五路旧命令最后指向虚空终焉。我去查它为什么至今没有结束。'],
        ['guild', '我们一起核对，不让一座钟替整个晨星作主。虚空报告也遵守这个规矩。'],
      ], '公会门廊 · 共同报时会谈'),
      questInspect('sky_common_notice', 'board', '在委托板核对报时与来源账的公开规则', [
        ['narrator', '公告列着到达时间、来源与转发次数，来源不明的条目仍有明确的待核标记。'],
        ['hero', '居民可以要求复核，也可以撤回自己的旧回应。'],
        ['narrator', '你记下两项规则的公开日期，没有把新制度说成从来就存在。'],
      ], '公会委托板 · 来源账规则'),
      questDialogue('sky_void_order', 'archivist', '向诺拉领取虚空末端的旧维护命令', [
        ['archivist', '命令写着“守至末端可卸”，却没有人登记过末端是否仍需同样的压力。'],
        ['hero', '第七队的去向可能就在这条维护链里。'],
        ['archivist', '可能。我们查职责和痕迹，不用希望替他们预写一个重逢。'],
      ]),
      questDialogue('sky_last_check', 'quartermaster', '与雷恩确认虚空调查的撤回原则', [
        ['quartermaster', '最深处也照旧分段核查，别因为快到答案就把全部人压在一次远征上。'],
        ['hero', '我会把确认过的范围带回来。'],
        ['quartermaster', '还有没确认的范围。那里最容易被我们自己的期待涂满。'],
      ]),
    ] },
    ]),
    ...campaignArc('虚空旧途', [
    { id: 'expanded_void_threshold', name: '阿榆走过的最后一页', reward: 40, icon: 'book', lore: '旧工匠阿榆的交接注释，把第七队的失踪从传说带回一个艰难的决定。', steps: [
      questDialogue('void_last_page', 'archivist', '听诺拉读阿榆留下的交接注释', [
        ['archivist', '“四处缓流仍不足，往末端卸压。不是奉令，六人议定。”这是阿榆的字。'],
        ['hero', '第七队自己决定继续往下走？'],
        ['archivist', '这页支持他们当时一起作出选择，不说明他们愿意永远失去归路。'],
        ['archivist', '后面有一行被汗水洇开了。布洛克也许认得工匠的缩写。'],
      ]),
      questDialogue('void_craft_name', 'smith', '请布洛克辨认阿榆的工匠缩写', [
        ['smith', '“留槽，不留人。”我老师也常这么写。工具要能接手，守它的人才有机会走。'],
        ['hero', '后来的命令却只剩“守至末端可卸”。'],
        ['smith', '阿榆写的是让下一班接得住，不是把自己铸成一根永不换的钉子。'],
        ['smith', '我以前夸他们忠诚，却没问谁去接下一班。现在想起来，话真轻。'],
      ]),
      questInspect('void_names_before', 'stele', '在英灵碑核对第七队留下的职责顺序', [
        ['narrator', '六行职责中，工匠阿榆并不在最后。队伍把“守阵”排成轮换，而非某个人的终身职责。'],
        ['hero', '他们原本也想一个接一个地回来。'],
        ['narrator', '你记下轮换顺序，碑上那块留白第一次有了如此具体的重量。'],
      ], '英灵碑 · 第七队轮换'),
      questDialogue('void_entry_scope', 'guild', '和莉娅确认追查第七队的范围', [
        ['guild', '我想看到他们回来，和所有人一样。但这份委托不能承诺一个我们还不知道的结局。'],
        ['hero', '先查最后的工作是否有人接手。'],
        ['guild', '也查他们想留下什么。别让他们只能以失踪者的样子出现在我们的故事里。'],
      ]),
    ] },
    { id: 'expanded_void_shaking', name: '雷恩握不稳的那次', reward: 40, icon: 'sword', lore: '出发前，军需官第一次把自己的撤退经历说完整。', steps: [
      questDialogue('void_old_retreat', 'quartermaster', '听雷恩讲年轻时没有说出的撤退', [
        ['quartermaster', '第一次当接应，我等到手发抖也不肯撤。以为站久一点，就能把迟到的人等回来。'],
        ['hero', '后来呢？'],
        ['quartermaster', '同伴拉我回营。第二天我们换人去找，才发现路已经换了出口。我只守着一个错地方。'],
        ['quartermaster', '所以我总催你记退路。可我以前没告诉你，我也曾经怕承认自己站错了。'],
      ]),
      questEvent('void_grip', 'starter', 1, '在军需官处重新确认本次初始武器'),
      questEvent('void_drill', 'practice', 8, '命中训练木桩 8 次，复盘紧张时的操作'),
      questDialogue('void_fear_lesson', 'mentor', '和艾琳谈雷恩的撤退经历', [
        ['mentor', '雷恩肯说，是因为他不想把“坚守”变成你不能回头的命令。'],
        ['hero', '越接近第七队的答案，我越怕自己会急。'],
        ['mentor', '怕并不耽误你做判断。没有退路的时候，才最容易把急迫错认成勇气。'],
        ['mentor', '把回来的理由也带着，和武器放在同一个行囊里。'],
      ]),
    ] },
    { id: 'expanded_void_unreturned', name: '回廊不归还的名字', reward: 45, icon: 'eye', lore: '虚空的环纹正在吞去来源，第七队却为后来者保留了辨认它们的办法。', steps: [
      questDialogue('void_sources', 'mentor', '向艾琳了解虚空环纹的辨认方法', [
        ['mentor', '虚空裂隙与变幻回廊会扰乱判断，旧队把来源写在环纹内侧，不只靠出口方向认路。'],
        ['hero', '就像天穹里看内纹，而非只看接收时间。'],
        ['mentor', '对。进入虚空属性神殿，先找保留的来源，不急着解释消失的那一段。'],
      ]),
      questEvent('void_shrine', 'visit', 1, '进入 1 间虚空终焉属性神殿房', { act: 6, type: 'shrine' }),
      questDialogue('void_six_marks', 'archivist', '向诺拉描述虚空环纹内侧的重复署记', [
        ['hero', '一处旧环纹内侧有六种署记，外圈的命令却只留了一个统领印。'],
        ['archivist', '六种署记与第七队轮换相符。他们不是消失在一个人的功劳背后，是共同做过维护。'],
        ['hero', '名字还能辨认吗？'],
        ['archivist', '有些只能认出职责。我们先保留它们，不让认不全成为抹掉所有人的理由。'],
      ]),
      questDialogue('void_shared_work', 'smith', '与布洛克核对旧队分工的工法意义', [
        ['smith', '六种记号表示六次接手。槽口交给下一个人时，还要让他看懂上一道怎么修。'],
        ['hero', '他们真的在等换班。'],
        ['smith', '是。不是一句“他们选择留下”就能把后来的无人接班全部免掉。'],
      ]),
    ] },
    { id: 'expanded_void_council', name: '把英雄请下石台', reward: 55, icon: 'feather', lore: '有人想把第七队称为自愿牺牲者，居民却必须先承认他们是想回家的人。', steps: [
      questDialogue('void_council', 'guild', '参加第七队选择与换班责任的会谈', [
        ['guild', '新线索说明第七队当时共同议定继续维护。有人建议把碑改成“自愿永守”。'],
        ['smith', '不行。阿榆明明写了留槽不留人。把他们写得越伟大，欠下的换班就越像不存在。'],
        ['archivist', '我们能确认当时的决定，不能替他们同意后面三十年的沉默。'],
        ['quartermaster', '我曾守错出口还不肯退。别让他们也被迫只能以不后悔的样子留在碑上。'],
        ['cook', '自愿去做一件难事的人，也会想吃一顿回家饭。别把他们说得不像人。'],
        ['hero', '我去查虚空的缓冲路线，先把他们没等到的接班条件核实。'],
        ['guild', '碑暂不改。追查职责和归路，谁也不能用一个漂亮称号替他们作最后的决定。'],
      ], '公会门廊 · 第七队归路会谈'),
      questEvent('void_buffer_clear', 'clear', 6, '清理 6 间虚空终焉战斗房，核查缓冲路线', { act: 6 }),
      questDialogue('void_relay', 'quartermaster', '向雷恩交付虚空可接应范围', [
        ['quartermaster', '这份范围足够让接应有位置，不再只留一句“往最深处去找”。'],
        ['hero', '会有新的队伍沿它出发吗？'],
        ['quartermaster', '要先准备，先讲清楚目标。我们不拿你的这份图催谁立刻证明忠诚。'],
      ]),
      questDialogue('void_food_memory', 'cook', '听米洛说那份给归来者留的饭', [
        ['cook', '小时候，家里总会多摆一只碗。我问给谁，大人说给路上的人。'],
        ['hero', '你知道具体在等谁吗？'],
        ['cook', '当时不知道。后来明白，那只碗不负责让人回来，只负责告诉我们别先替人决定不回了。'],
        ['cook', '我会留饭，也会照顾还在桌边的人。两件事都不能丢。'],
      ]),
    ] },
    { id: 'expanded_void_corridor', name: '变幻之外的一笔', reward: 50, icon: 'gem', lore: '变幻回廊的试炼提醒：靠重复辨认的方法，比一次幸运找到出口更能传给后来者。', steps: [
      questDialogue('void_trial_brief', 'mentor', '听艾琳交代虚空挑战房的核查目标', [
        ['mentor', '旧队在回廊里反复试过接应。去一间虚空挑战房，看困难是否仍能由不同的人接手。'],
        ['hero', '需要完成挑战才算吗？'],
        ['mentor', '这一项只要求进入并辨认环境，别为了我们的笔记勉强承受你没有准备好的战斗。'],
        ['mentor', '之后另清理三间战斗房，比较连续操作与一次特殊试炼的区别。'],
      ]),
      questEvent('void_trial_visit', 'visit', 1, '进入 1 间虚空终焉挑战房', { act: 6, type: 'challenge' }),
      questEvent('void_trial_clear', 'clear', 3, '清理 3 间虚空终焉战斗房，复核连续接应', { act: 6 }),
      questDialogue('void_repeatable', 'smith', '与布洛克讨论旧队留下的可接手方法', [
        ['smith', '你分开写了特殊试炼和连续路段，这样后来的人才能知道该准备哪一种。'],
        ['hero', '第七队也反复试过，不是凭一次奇迹走到底。'],
        ['smith', '阿榆的笔记里到处是划掉重做。他若知道我们把他讲成从不犯错的传奇，多半要骂人。'],
        ['smith', '把划掉的地方也留着，手艺就是从那里往前走的。'],
      ]),
    ] },
    { id: 'expanded_void_legacy', name: '王座下没有王命', reward: 60, icon: 'skull', lore: '腐化王座附近的旧署记，揭示第七队最后留下的是交接而非永恒命令。', steps: [
      questDialogue('void_throne_brief', 'archivist', '向诺拉确认虚空首领与旧署记的核查范围', [
        ['archivist', '末端出口的压流记号沿用旧队工法。它们被首领占据后，不再能顺利接手。'],
        ['hero', '先打通一处首领出口，再查旧装置形制。'],
        ['archivist', '对。腐化王座会让人想起被困的英雄，但我们不能因为名字相像就把任何首领认作第七队。'],
        ['archivist', '我们追查的是证据，不是一个等着我们替它圆好的传说。'],
      ]),
      questEvent('void_legacy_boss', 'boss', 1, '击败 1 位虚空终焉首领，疏通出口节点', { act: 6 }),
      questEvent('void_legacy_treasure', 'visit', 1, '进入 1 间虚空终焉宝物房，核对旧装置形制', { act: 6, type: 'treasure' }),
      questDialogue('void_last_instruction', 'mentor', '与艾琳核对第七队的最后交接训令', [
        ['hero', '旧装置的分段纹与六次署记对应，末端留的是接手位置，没有继续发号施令的纹。'],
        ['mentor', '他们留下的不是王命，是问后来者能不能接住这一班。'],
        ['hero', '老师为什么只教过我“守阵人走在最后面”？'],
        ['mentor', '也许他也只读到了一半。现在我要把另一半教给你：最后面的人，也应有人来接。'],
      ]),
    ] },
    { id: 'expanded_void_heart', name: '终焉之心的归路', reward: 75, icon: 'crown', lore: '完整走通虚空终焉，让五路旧压力不再只靠没有下一班的人守住。', steps: [
      questDialogue('void_full_brief', 'guild', '向莉娅登记完整虚空终焉远征', [
        ['guild', '这是最深的一幕。目标是验证整条末端链路，不是用一次胜利买一个圆满的结局。'],
        ['hero', '若没有找到第七队本人呢？'],
        ['guild', '把找到的交接与没找到的去向都带回来。我们不让一份不完整的答案变成你的过错。'],
        ['guild', '雷恩负责接应，米洛留着饭，艾琳守着法阵。你有回来报告的地方。'],
      ]),
      questEvent('void_full_win', 'win', 1, '完整通关虚空终焉 1 次', { act: 6 }),
      questDialogue('void_heart_reading', 'mentor', '与艾琳核对完整末端链路的回流', [
        ['mentor', '五路来源能分别读出了，不再只有一条“继续代守”的回声。这次验证是真的。'],
        ['hero', '终焉之心也不该成为一切等待的名字。'],
        ['mentor', '对。我们能为仍在运作的归路安排下一班，至于已经走散的人，调查要继续。'],
      ]),
      questDialogue('void_heart_wait', 'cook', '回食堂向米洛报平安', [
        ['cook', '先坐下。你一路都在替很多人的问题找答案，现在先回答我：饿不饿？'],
        ['hero', '饿。也有一点难过。'],
        ['cook', '两种都可以带回家。我没往汤里放“你应该高兴”，只放了你能吃下的东西。'],
        ['cook', '慢慢吃。他们还没有答案的名字，我们明天继续守。'],
      ]),
    ] },
    { id: 'expanded_void_handover', name: '终于写下下一班', reward: 60, icon: 'feather', lore: '第七队的去向仍有留白，归路却终于可以不再要求任何人永远坚守。', steps: [
      questDialogue('void_handover_council', 'guild', '参加五路交接与第七队记录的会谈', [
        ['guild', '整条虚空链路验证完成。我们没有找到能确认第七队最终去向的证据。'],
        ['archivist', '那就保留留白，同时记下六人的分工与交接。他们不只剩一个失踪日期。'],
        ['smith', '阿榆的接手工法会留在维护图里，不再只被叫成忠诚的象征。'],
        ['mentor', '课程也改。守最后一段的人必须知道下一班是谁，谁都能问这个问题。'],
        ['quartermaster', '我把换班的责任写到接应计划第一页，不再藏在末尾。'],
        ['cook', '饭留给路上的人，也给回到镇上的人。等待不能吞掉还在过的日子。'],
        ['hero', '我们不能改写过去，但能让下一支队伍有具体的回来办法。'],
        ['guild', '今天先做到这一件。之后要把它变成晨星的日常，而不是又一段只好听一次的传说。'],
      ], '公会门廊 · 下一班会谈'),
      questInspect('void_memorial_after', 'stele', '重读英灵碑上的职责与去向留白', [
        ['narrator', '你再次看见那六行职责。那些不完整的名字，如今有了能够讲述的工作与选择。'],
        ['hero', '去向留白，交接有证。我们不把这两个结论混成一声轻松的结束。'],
        ['narrator', '你把今天的核查日期记下，准备交给诺拉继续保存。'],
      ], '英灵碑 · 六人交接'),
      questDialogue('void_craft_future', 'smith', '与布洛克讨论让旧工法传给后来者', [
        ['smith', '以后我收学徒，第一件事不是夸他扛得住，是问他会不会教别人接手。'],
        ['hero', '阿榆那句留槽不留人，也会教吗？'],
        ['smith', '会。连同他划掉重做的那些地方一起教。真实的手艺值得被传下去。'],
      ]),
      questDialogue('void_next_morning', 'guild', '和莉娅约定晨星下一阶段的生活', [
        ['guild', '新的晨星不是再添一句伟大的名字。明早大家照常开门，我们把今天的约定做到日常里。'],
        ['hero', '从哪件小事开始？'],
        ['guild', '从你去问每个人还想怎样生活开始。经历这么多，他们不该只剩下“负责等你”。'],
      ]),
    ] },

    ]),
    ...campaignArc('归途盟约', [
    { id: 'expanded_home_smith', name: '布洛克想教的第一课', reward: 40, icon: 'hammer', lore: '远征之后，铁匠把“教别人接手”当作工坊重新开始的第一件事。', steps: [
      questDialogue('home_smith_request', 'smith', '听布洛克谈他想留下的工坊课程', [
        ['smith', '我老师临走前让我把手艺传下去，我却一直以为把活全做完就算尽责。'],
        ['hero', '一直做完，别人反而没有学的机会。'],
        ['smith', '对。准备几份你已解锁的图纸，我想把通用工法讲给能继续用它的人。'],
        ['smith', '不用新买来证明支持我，学过的东西拿出来讨论就很好。'],
      ]),
      questOwned('home_smith_patterns', 'blueprint', 6, '拥有 6 张已解锁的装备图纸供工坊教学'),
      questDialogue('home_smith_lesson', 'smith', '和布洛克整理图纸里的可传授工法', [
        ['smith', '尺寸、修理原因、不能照抄的地方，都有了。还有一栏，我以前没写过：谁可以问。'],
        ['hero', '所有想学的人？'],
        ['smith', '对。不必先像个大师才配问为什么。这是我想教的第一课。'],
      ]),
      questDialogue('home_smith_archive', 'archivist', '请诺拉保留工坊课程的修订过程', [
        ['archivist', '我会留初稿和布洛克改过的那一栏。后来的学徒知道规则也曾经有人争取。'],
        ['hero', '他希望问题能被当面问出来。'],
        ['archivist', '那就让这份记录也可以被问。不把课程变成又一块不许碰的石碑。'],
      ]),
    ] },
    { id: 'expanded_home_mentor', name: '艾琳留下的第二半', reward: 40, icon: 'book', lore: '导师第一次把自己的疑问放进课程，让后来者不必只背已经定好的答案。', steps: [
      questDialogue('home_mentor_begin', 'mentor', '听艾琳说明归路课程的另一半', [
        ['mentor', '小时候我喜欢老师每次都能回答。后来当了导师，反而害怕学生问到我不知道的事。'],
        ['hero', '这次我们很多问题都是一起找到答案的。'],
        ['mentor', '所以新课先讲边界：力量可以学，判断必须不断复核。拿你已有的天赋经验来讨论。'],
      ]),
      questOwned('home_mentor_talents', 'talent', 18, '累计习得 18 级天赋，整理不同成长经验'),
      questEvent('home_mentor_drill', 'practice', 10, '命中训练木桩 10 次，观察已有天赋下的操作'),
      questDialogue('home_mentor_question', 'mentor', '与艾琳复盘成长路线与不能代替的判断', [
        ['mentor', '同样十次命中，每个人依靠的习惯都不同。课程不能把你的路线叫成唯一正确。'],
        ['hero', '你希望后来者问什么？'],
        ['mentor', '问“我为什么要这样做”，也问“什么时候可以停”。老师听到这些问题，不该先觉得被冒犯。'],
        ['mentor', '而我不知道的时候，就诚实说不知道，陪他们去找。'],
      ]),
    ] },
    { id: 'expanded_home_kitchen', name: '不为告别写的菜单', reward: 40, icon: 'food', lore: '米洛想写一份平常日子的菜单，让食堂的故事不再只有出发和等待。', steps: [
      questDialogue('home_cook_menu', 'cook', '听米洛谈食堂想恢复的平常菜单', [
        ['cook', '以前每张菜单都写出征、接应、应急。我已经很久没认真想普通周末吃什么了。'],
        ['hero', '你最想做哪道？'],
        ['cook', '一锅不催着人起身的汤。先选份餐，让我记住不同的人到底喜欢什么。'],
        ['cook', '以后有远征，我照样准备；没有远征，我也不必觉得这天没有意义。'],
      ]),
      questEvent('home_cook_order', 'meal', 1, '到食堂预订 1 份喜欢的出征餐'),
      questDialogue('home_cook_choice', 'cook', '与米洛讨论这次餐食的选择', [
        ['cook', '我记下你的选择了。不是为了把所有人的口味统一，是免得又用我觉得好代替你喜欢。'],
        ['hero', '你也应该有自己想吃的。'],
        ['cook', '有，第一锅试味归我。我总说人要休息，也该让自己坐下来尝一碗。'],
      ]),
      questDialogue('home_cook_shift', 'quartermaster', '请雷恩把米洛的休息写进轮换', [
        ['quartermaster', '米洛也要轮换，这项我以前真漏了。总以为食堂灯亮着，那里的人就不累。'],
        ['hero', '这次让他有时间试自己的菜单。'],
        ['quartermaster', '写好了。轮换不是只给前线的奖赏，是让每份工作都有人能接手。'],
      ]),
    ] },
    { id: 'expanded_home_table', name: '六个人终于坐下来', reward: 50, icon: 'heart', lore: '居民围坐时谈的第一次不只是远征，还谈各自想从忙碌中留下一点什么。', steps: [
      questDialogue('home_table_scene', 'cook', '参加食堂门前的居民晚餐会谈', [
        ['cook', '今天先坐下再谈。锅在身后，我也坐在这里，不站着等大家吃完。'],
        ['smith', '我想腾一段时间教图纸，不把每个空闲都拿去接下一单。'],
        ['mentor', '我想重新读老师的笔记，这次带着自己的问题读，不只是替他守答案。'],
        ['archivist', '我想整理一些不属于军令的故事。谁在哪儿学会做饭，也值得进档案。'],
        ['quartermaster', '我想去一趟没有接应任务的商路。但先学会交班，不把账抱着一起出门。'],
        ['guild', '我想听大家说完，而不是每句话都替公会安排下一件事。'],
        ['hero', '那我今晚只做一件事，把这些愿望记住。'],
        ['cook', '好，先吃。这顿饭不用变成出发前最后一顿。'],
      ], '食堂门前 · 六位居民晚餐'),
      questDialogue('home_table_listen', 'guild', '与莉娅谈晚餐时没有排进委托的愿望', [
        ['guild', '我差点又把大家的话写成工作单。愿望不是只要盖章就得完成的任务。'],
        ['hero', '公会能为他们做什么？'],
        ['guild', '留时间、留接手的人。别替他们规定怎么享受那段时间。'],
      ]),
      questInspect('home_table_board', 'board', '检查委托板上仍占用旧轮换的便条', [
        ['narrator', '你核对便条日期，找出仍引用旧轮换的条目，把编号记下。'],
        ['hero', '先清掉会把他们又拉回全天待命的旧安排。'],
        ['narrator', '你没有自行删去有效委托，准备让雷恩核对交班范围。'],
      ], '公会委托板 · 晚餐后的轮换核对'),
      questDialogue('home_table_handover', 'quartermaster', '与雷恩确认晚餐后的轮换交接', [
        ['quartermaster', '这些确实用了旧表。我改掉引用，不让一张忘撤的纸把新休息取消。'],
        ['hero', '你那趟没有接应任务的商路呢？'],
        ['quartermaster', '还没选好日子。但这次我会真的选，不先把它写成永远的以后。'],
      ]),
    ] },
    { id: 'expanded_home_archive', name: '没有英雄称号的那一页', reward: 40, icon: 'feather', lore: '诺拉为失踪者与仍在生活的人保留不同的页码，让记忆不吞没今天。', steps: [
      questDialogue('home_archive_request', 'archivist', '听诺拉说明居民故事与第七队记录的安排', [
        ['archivist', '我想把第七队的职责写清，也把今天的人写清。不让一本档案只有远征与死亡。'],
        ['hero', '他们的去向还没有最后答案。'],
        ['archivist', '那就留着。留白可以与新的生活共存，不是只有填完过去才能继续往后写。'],
        ['archivist', '你再看看碑，再问问艾琳愿不愿意留下她自己的话。'],
      ]),
      questInspect('home_archive_stele', 'stele', '在英灵碑核对第七队的已知职责与未知去向', [
        ['narrator', '六行职责仍在，去向留白仍在。你把确认过与尚未确认的部分分别记下。'],
        ['hero', '不拿希望作结论，也不拿没有结论取消希望。'],
        ['narrator', '你把记录收好，碑前的风声没有替任何名字回答。'],
      ], '英灵碑 · 两种保留'),
      questDialogue('home_archive_mentor', 'mentor', '请艾琳留下她自己的归路回忆', [
        ['mentor', '那就记一件小事。我第一次走进镇子，老师没有问资质，只问我是不是饿了。'],
        ['hero', '这与后来教的力量有关吗？'],
        ['mentor', '有关。我却很久以后才明白。人先觉得这里可以停下来，才肯把自己不知道的事说出来。'],
      ]),
      questDialogue('home_archive_return', 'archivist', '把艾琳的个人回忆交给诺拉', [
        ['archivist', '这一页写“艾琳的第一次抵达”，不用挂在导师履历的最后一行。'],
        ['hero', '她曾经也是不知道该去哪儿的新来者。'],
        ['archivist', '我们的居民都不只是一种职责。记得这一点，下一次分歧才不会只看见职位。'],
      ]),
    ] },
    { id: 'expanded_home_rehearsal', name: '交班以前的练习', reward: 45, icon: 'armor', lore: '归途盟约要先在一套普通准备里成立，而非只在重大远征前被认真对待。', steps: [
      questDialogue('home_rehearsal_brief', 'quartermaster', '向雷恩领取普通出发的交班核查', [
        ['quartermaster', '这次没有五路大事，只有一次普通整备。规矩若只在大事前有效，就还没变成生活。'],
        ['hero', '先确认武器，再练基础？'],
        ['quartermaster', '对。之后找艾琳复盘，看看普通准备也能不能说清自己的上限。'],
      ]),
      questEvent('home_rehearsal_weapon', 'starter', 1, '在军需官处确认 1 次初始武器'),
      questEvent('home_rehearsal_drill', 'practice', 12, '命中训练木桩 12 次，完成基础操作复盘'),
      questDialogue('home_rehearsal_finish', 'mentor', '和艾琳复盘普通整备与交班', [
        ['mentor', '训练完成，但课程最后一问还是一样：如果需要停，你准备怎样说？'],
        ['hero', '说已确认的范围、自己的状态，以及哪一段还没做完。'],
        ['mentor', '很好。停下来也能是一份清楚的交接，不必先找个足够光荣的理由。'],
        ['mentor', '把这份答案带去莉娅那里，我们准备把归途盟约逐条读给大家。'],
      ]),
    ] },
    { id: 'expanded_home_lantern', name: '灯照见的人', reward: 50, icon: 'gem', lore: '曾经象征等待的归途灯，如今也提醒晨星看见已经回到镇上的人。', steps: [
      questInspect('home_lantern_circle', 'portal', '在法阵复核五路来源与晨星接收刻记', [
        ['narrator', '你沿铜环逐段比对留下的来源记录，五路各有自己的记号，没有合并成一个统领印。'],
        ['hero', '来自哪里、经过哪里、谁在等待，都能分别追问了。'],
        ['narrator', '你记录这次复核日期，不把稳定说成此后永远无须维护。'],
      ], '出征法阵 · 盟约前复核'),
      questDialogue('home_lantern_guild', 'guild', '与莉娅谈归途灯今后的意义', [
        ['guild', '起初我总盯着灯，怕漏掉归来的人。后来发现，回来了的人也会在我面前悄悄累着。'],
        ['hero', '灯不只要照出口。'],
        ['guild', '嗯。归来不是最后一步。有人得问他们想怎样休息、怎样继续生活，而不只是发下一份委托。'],
      ]),
      questDialogue('home_lantern_smith', 'smith', '请布洛克确认归途维护图的接手原则', [
        ['smith', '维护图写好了：留尺寸、留原因、留下一班。谁修都得能解释，不只说我会。'],
        ['hero', '后来人也可以改你写的？'],
        ['smith', '拿出理由就可以。留图是让人继续修，不是让我的名字守住每一道槽。'],
      ]),
      questDialogue('home_lantern_cook', 'cook', '听米洛为盟约会谈准备的最后一句话', [
        ['cook', '我想说，出发的人需要饭，归来的人需要饭，没有出发的人也需要饭。'],
        ['hero', '听起来普通得不像盟约。'],
        ['cook', '那正好。我们绕了这么远，总该让普通日子也能被认真守住。'],
      ]),
    ] },
    { id: 'expanded_home_covenant', name: '晨星不只等英雄', reward: 75, icon: 'crown', lore: '六位居民共同读出归途盟约：允许提问、保留条件、记得交班，也让日常继续。', steps: [
      questDialogue('home_covenant_scene', 'guild', '参加晨星归途盟约的最终居民会谈', [
        ['guild', '从迟来的回声走到今天，我们不许诺永远不会出错。第一条：每次承诺都留条件与期限。'],
        ['archivist', '第二条：保留来源与修订，坏消息也能抵达。不知道的，不替它编一个合适的结局。'],
        ['mentor', '第三条：任何人都能问为什么、什么时候可以停。学会力量，也要学会说自己的上限。'],
        ['smith', '第四条：留下能接手的工法。维护不是某个人一辈子的命令，下一个人也有权改得更好。'],
        ['quartermaster', '第五条：每段坚守都有交班。等待的时间与补给由计划承担，不让它藏成某个人的过错。'],
        ['cook', '最后一条：饭、休息与平常的愿望，不只留给胜利者。回来的人可以难过，也可以重新开始。'],
        ['hero', '我愿意照着做，也愿意在它做不到的时候提出问题。第七队的去向，我们继续查。'],
        ['guild', '同意。这份盟约给路上的人，也给已经站在晨星的人。现在，让今天继续。'],
      ], '公会门廊 · 晨星归途盟约'),
      questInspect('home_covenant_board', 'board', '在委托板核对归途盟约的六项约定', [
        ['narrator', '六项约定旁列着今日的参与者与复核日期，没有刻上永不更改。'],
        ['hero', '以后的人可以指出它哪里做不到，也可以接着把它修好。'],
        ['narrator', '你把核对结果写在末尾。写完后，纸上仍留着容纳下一次修订的空白。'],
      ], '公会委托板 · 可继续的盟约'),
      questDialogue('home_covenant_archive', 'archivist', '与诺拉确认六篇远征的最后记录', [
        ['archivist', '霜原的等待、腐沼的警告、黄沙的条件、天穹的来源、虚空的交接，还有晨星的生活。'],
        ['hero', '第七队仍没有最后一页。'],
        ['archivist', '没有。我会继续保留它，也不会因此空着今天。你们每个人都已经有了不只属于远征的一页。'],
        ['archivist', '下一份记录可以从一件小事开始，不必等新的灾难。'],
      ]),
      questDialogue('home_covenant_dinner', 'cook', '回食堂与米洛约定下一顿平常饭', [
        ['cook', '故事读完了？那下一顿你想吃什么？这次不用先说准备去哪里。'],
        ['hero', '先给我留个能坐下的位置。'],
        ['cook', '一直有。以后你还会远行，也会回来，有时只是路过来吃一碗。'],
        ['cook', '晨星不只等英雄。它也等一个终于能把行囊放下的人。'],
      ], '食堂门前 · 行囊放下之后'),
    ] },
    ]),
  ];
}
