'use strict';
// Ordered objectives keep conversation, preparation and exploration in the same saved journal.
const questDialogue = (id, npc, label, lines, setting) => ({ id, type: 'dialogue', npc, label, setting,
  lines: lines.map(([speaker, text]) => ({ speaker, text })) });
const questEvent = (id, event, goal, label, match) => ({ id, type: 'event', event, goal, label, ...(match ? { match } : {}) });
const questOwned = (id, event, goal, label) => ({ id, type: 'owned', event, goal, label });
const questInspect = (id, target, label, lines, setting) => ({ id, type: 'event', event: 'inspect', target, goal: 1, label, setting,
  lines: lines.map(([speaker, text]) => ({ speaker, text })) });
const CAMP_MAIN = [
  { id: 'greeting', name: '初到晨星', reward: 20, icon: 'book', lore: '报到的那天，法阵第一次漏掉了归来的脚步声。', steps: [
    questDialogue('register', 'guild', '向委托官莉娅报到', [
      ['guild', '把名字写在这儿。晨星镇欢迎冒险者，也负责等他们回来。'],
      ['hero', '登记册旁为什么放着一盏不熄的灯？'],
      ['guild', '那是归途灯。昨夜法阵暗了一次，巡逻队差点找不到镇口。'],
      ['guild', '先去找导师艾琳和铁匠布洛克。认识你要托付后背的人，比接一张讨伐单更要紧。'],
    ]),
    questDialogue('meet_mentor', 'mentor', '拜访导师艾琳', [
      ['mentor', '莉娅终于肯让新人先来上课了。你听见法阵的声音了吗？'],
      ['hero', '像两次心跳，第二次要慢一点。'],
      ['mentor', '不错。正常的归途纹只应回响一次。别急着替它下结论，记住这个节拍。'],
      ['mentor', '去看看布洛克的工坊。他宁愿熬夜，也不愿把一把松动的剑交出去。'],
    ]),
    questDialogue('meet_smith', 'smith', '拜访铁匠布洛克', [
      ['smith', '先别碰那枚铜环，烫。我从法阵边拆下来时，它也这样发热。'],
      ['hero', '这和武器有什么关系？'],
      ['smith', '同一种旧铸法。刀剑的裂口能看见，法阵的裂口藏在里面。'],
      ['smith', '你的武器我检查过了。回来时带上新的见闻，别只带一袋金币。'],
    ]),
  ] },
  { id: 'flickering_circle', name: '迟来的回声', reward: 20, icon: 'gem', lore: '沿着法阵边缘寻找那次多出来的脉动。', steps: [
    questInspect('circle_trace', 'portal', '在出征法阵检查外环刻痕', [
      ['narrator', '你蹲在法阵外环。左侧刻痕明亮，右侧却迟了一拍才亮起。'],
      ['hero', '这里有一条新裂缝，下面还压着旧刻字。'],
      ['narrator', '擦去浮灰后，露出的三个字是：先接地。'],
      ['hero', '不像咒语，倒像给修理工留下的说明。'],
    ], '法阵外环 · 调查'),
    questDialogue('circle_report', 'mentor', '把法阵刻痕告诉艾琳', [
      ['hero', '裂缝下面刻着“先接地”，外环还比内环慢一拍。'],
      ['mentor', '先接地……旧守阵人的术语。法阵可能是在把多余的力量送回地下。'],
      ['mentor', '我会守着外环。你按原定试炼出发，别单凭一道裂缝惊动全镇。'],
      ['mentor', '诺拉保管着旧档案。等你熟悉地牢，我们再把这件事交给她。'],
    ]),
  ] },
  { id: 'first_hunt', name: '试炼之刃', reward: 25, icon: 'sword', lore: '第一次远行，既是试炼，也是在确认归路。', steps: [
    questDialogue('training_brief', 'quartermaster', '听军需官雷恩讲解试炼', [
      ['quartermaster', '手先放松，肩别抬太高。我见过太多握剑握到抽筋的新兵。'],
      ['hero', '公会只写了清剿魔物。'],
      ['quartermaster', '我另加一条：回得来。法阵有延迟，撤退时看脚下的光，别凭声音冲进去。'],
      ['quartermaster', '击败三十只敌人，足够让你熟悉手里的武器。回来让莉娅听听真实情况。'],
    ]),
    questEvent('trial_hunt', 'kill', 30, '击败 30 只地牢敌人'),
    questDialogue('trial_report', 'guild', '向莉娅汇报第一次试炼', [
      ['guild', '三十只，记好了。比数字更要紧的是，你在归途上看到了什么？'],
      ['hero', '法阵确实迟了一拍，但出口的光还在。'],
      ['guild', '那就还能维持。商队不愿再等，我得替他们安排一条稳妥的路。'],
      ['guild', '你的下个任务会影响很多人的饭碗。先把武器放下，喘口气。'],
    ]),
  ] },
  { id: 'missing_dispatch', name: '没有署名的急件', reward: 25, icon: 'book', lore: '有人把三十年前的调令贴在了新的委托板上。', steps: [
    questDialogue('dispatch_request', 'guild', '询问公会委托板上的急件', [
      ['guild', '今早多了张调令，没有印章，纸却比我的档案还旧。'],
      ['hero', '会不会是有人恶作剧？'],
      ['guild', '上面写着“暂停深层运矿”。商队刚好准备恢复这条线，我不想赌。'],
      ['guild', '你去仔细看看，再让诺拉核对年代。别把原件撕下来。'],
    ]),
    questInspect('dispatch_read', 'board', '在公会委托板辨认旧调令', [
      ['narrator', '你从新委托的边角读到一张褪色调令。'],
      ['hero', '“归途环降温前，不许搬运共鸣石。”落款是远征第七队。'],
      ['narrator', '纸背有四个针孔，排列与法阵外环的铜钉一致。'],
      ['hero', '它曾经钉在别的地方，不是最近写的。'],
    ], '公会委托板 · 调查'),
    questDialogue('dispatch_date', 'archivist', '请书记官诺拉核对调令', [
      ['archivist', '第七队……他们的卷宗缺了最后一册。所有人都说那队失踪了。'],
      ['hero', '这张调令为什么会重新出现？'],
      ['archivist', '纸张是旧的，墨迹也是。谁搬动了它，还不能下结论。'],
      ['archivist', '我会找出运矿路线。请告诉莉娅，恢复商路时别靠近共鸣石仓。'],
    ]),
  ] },
  { id: 'path', name: '重开商路', reward: 30, icon: 'boots', lore: '腾出道路，让补给先于猜测抵达晨星镇。', steps: [
    questDialogue('road_request', 'cook', '听厨师米洛说明补给短缺', [
      ['cook', '汤里今天少了两种菜。我可以骗过舌头，可骗不过肚子。'],
      ['hero', '商队还没恢复？'],
      ['cook', '雷恩把路线重新划了，只走外层。可那几间房又被魔物占了。'],
      ['cook', '清出六间战斗房就够第一批人通过。别为了我的菜篮子跑进石仓。'],
    ]),
    questEvent('road_clear', 'clear', 6, '清理 6 间战斗房'),
    questDialogue('road_confirm', 'quartermaster', '把安全路段交给雷恩', [
      ['quartermaster', '这几处拐角标得很好。商队遇袭时有地方退，不会被堵在一条走廊里。'],
      ['hero', '你为什么不用最短的那条路？'],
      ['quartermaster', '最短的路经过旧石仓。诺拉的便条一来，我就把它划掉了。'],
      ['quartermaster', '现在缺的不是勇气，是整备。帮我把新人出发前的流程试一遍。'],
    ]),
  ] },
  { id: 'supply_chain', name: '出发前的三件事', reward: 25, icon: 'food', lore: '武器、手感、热食。有人归来，准备才算有用。', steps: [
    questEvent('supply_weapon', 'starter', 1, '到军需官处确认一次初始武器'),
    questEvent('supply_practice', 'practice', 5, '在营地训练木桩命中 5 次'),
    questDialogue('supply_recipe', 'cook', '请米洛安排出征餐', [
      ['cook', '听说雷恩让你练了五下。只是五下，可比拿到武器就走强。'],
      ['hero', '你准备的餐食也算整备？'],
      ['cook', '当然。有人怕冷，有人跑得快，有人只想带点好运。各吃各的，别硬塞同一锅。'],
      ['cook', '选一份你喜欢的。我还得给运货的人留点汤，今晚他们会回来。'],
    ]),
    questEvent('supply_meal', 'meal', 1, '到食堂预订一份出征餐'),
  ] },
  { id: 'relics', name: '遗失之物', reward: 25, icon: 'gem', lore: '宝箱的价值有时藏在不起眼的旧零件上。', steps: [
    questDialogue('relic_brief', 'archivist', '向诺拉领取遗物线索', [
      ['archivist', '第七队不只运矿，还带过四套稳流器。工坊登记册只剩数量，没有图样。'],
      ['hero', '你希望我找回稳流器？'],
      ['archivist', '别许太大的愿。先调查三处宝箱，记下有没有同样的铜钉和环纹。'],
      ['archivist', '你遇到的装备会自动记进图鉴。图样比猜测可靠，空手回来也别编故事。'],
    ]),
    questEvent('relic_search', 'chest', 3, '打开 3 个地牢宝箱，记录遗物形制'),
    questDialogue('relic_compare', 'archivist', '把遗物见闻交给诺拉', [
      ['hero', '几处宝箱上的锁扣也有四孔环纹，位置和调令纸上的针孔相同。'],
      ['archivist', '说明工匠们用了同一套记号。不是每只箱子都藏着机关，但能串起出处。'],
      ['archivist', '旧档案说稳流器原本装在归途环旁。英灵碑上也许留着那批工匠的名字。'],
      ['archivist', '请你读一读。我见过碑太多次，反而怕漏掉熟悉的那一行。'],
    ]),
  ] },
  { id: 'names_in_stone', name: '石碑上的留白', reward: 25, icon: 'feather', lore: '失踪者的名字后，留着一行未刻完的注释。', steps: [
    questInspect('stone_names', 'stele', '调查英灵碑底部的未刻字迹', [
      ['narrator', '英灵碑最下面一行比其他名字浅，似乎没有刻完。'],
      ['hero', '“远征第七队——驻守归途……”后面留了一块空白。'],
      ['narrator', '碑侧的小字写着“名录待归者核定”，不是阵亡名录。'],
      ['hero', '镇上的人把失踪和牺牲混在了一起。'],
    ], '英灵碑 · 调查'),
    questDialogue('stone_memory', 'mentor', '询问艾琳关于守阵人的记忆', [
      ['mentor', '我很小的时候，老师常说，守阵人要走在队伍最后面。'],
      ['hero', '第七队会不会还在地牢里？'],
      ['mentor', '三十年太久，不能用希望代替事实。但碑上既然写着驻守，我们就有理由查下去。'],
      ['mentor', '门后的守卫也许守的是归途环，不只是一条通道。先弄清它为何不肯让人靠近。'],
    ]),
    questDialogue('stone_record', 'archivist', '请诺拉更正第七队的档案备注', [
      ['archivist', '我会写“去向待查”，不再把他们记进阵亡名单。'],
      ['hero', '这样会让人等得更久吗？'],
      ['archivist', '也许。但档案要忠于证据，不负责替人尽快忘记。'],
      ['archivist', '等你有新的线索，我就在这里。今天这一页，先留白。'],
    ]),
  ] },
  { id: 'guardian', name: '门后的守卫', reward: 40, icon: 'skull', lore: '阻挡远行的首领，也站在最关键的归途节点上。', steps: [
    questDialogue('guardian_brief', 'mentor', '听艾琳说明守卫与归途节点', [
      ['mentor', '首领占据的房间通常连着楼层出口。那也是法阵最容易积压力量的地方。'],
      ['hero', '击败它就能修好法阵？'],
      ['mentor', '不能。我们只能先让一处节点畅通，看看镇上的回声是否改变。'],
      ['mentor', '一位首领就够这次验证。别把调查当成必须一口气赢到底的比赛。'],
    ]),
    questEvent('guardian_battle', 'boss', 1, '击败 1 位地牢首领'),
    questDialogue('guardian_result', 'guild', '回公会核对法阵回声', [
      ['guild', '你回来的那一刻，灯亮了两次。这回第二次没那么迟了。'],
      ['hero', '艾琳说这是节点畅通后的变化。'],
      ['guild', '那我们的修复方向就有证据了。布洛克一直在等这些变化，不肯只照旧图打铁。'],
      ['guild', '把消息亲口告诉他吧。他已经把炉火压小了，就怕漏听脚步声。'],
    ]),
  ] },
  { id: 'forge_record', name: '工坊旧账', reward: 25, icon: 'hammer', lore: '稳流器不是失传的圣物，是被误记为兵器的修理工具。', steps: [
    questDialogue('forge_inventory', 'smith', '听布洛克讲旧工坊的稳流器', [
      ['smith', '回声变快了？好，证明铜环不是白拆的。现在看这张工坊旧账。'],
      ['hero', '上面写“盾圈四套”，不是稳流器。'],
      ['smith', '外行看起来像盾圈。可它没有握把，只留了导流槽。有人把工具记成了兵器。'],
      ['smith', '雷恩的军械账也有同一笔。他知道那批东西最终送到哪儿。'],
    ]),
    questDialogue('forge_delivery', 'quartermaster', '向雷恩追查旧军械的去向', [
      ['quartermaster', '那一页我记得，四套盾圈，零把盾。前任军需官还在旁边打了问号。'],
      ['hero', '运送地点写着什么？'],
      ['quartermaster', '归途井，不是城墙。交接人是第七队的工匠阿榆。'],
      ['quartermaster', '这不是丢了军械，是我们一直读错账。去请诺拉把两份记录放在一起。'],
    ]),
    questDialogue('forge_reconcile', 'archivist', '和诺拉核对工坊及军械记录', [
      ['archivist', '名字、数量、日期都对上了。第七队留下的是维护计划。'],
      ['hero', '那我们可以照计划修？'],
      ['archivist', '能修多少，还得看现有图纸。记录证明用途，不能替代工艺。'],
      ['archivist', '我把注释抄给布洛克。你也去看看工坊能做什么，别让他一个人守着旧账发愁。'],
    ]),
  ] },
  { id: 'forge', name: '工坊复兴', reward: 25, icon: 'hammer', lore: '先让工艺重新流转，修复才有落脚的地方。', steps: [
    questDialogue('blueprint_request', 'smith', '与布洛克讨论可用的图纸', [
      ['smith', '旧稳流器的图纸缺角了。但现有装备图纸里，也用得到相同的铸槽法。'],
      ['hero', '要我重新买一张吗？'],
      ['smith', '有就用已有的。工艺不是收据，谁学会了，谁就能接着做。'],
      ['smith', '拥有一张解锁图纸就够。我会从它的边角工法开始试铸。'],
    ]),
    questOwned('blueprint_owned', 'blueprint', 1, '拥有 1 张已解锁的装备图纸'),
    questDialogue('blueprint_test', 'smith', '查看布洛克的试铸结果', [
      ['smith', '槽口能对上，冷却后也没变形。第一件合格，另外三件就有办法了。'],
      ['hero', '我们还差什么？'],
      ['smith', '符文顺序。铁能承受多少我知道，力量往哪儿走得问艾琳。'],
      ['smith', '把这段试铸结果带给她。等她点头，我再把炉火烧旺。'],
    ]),
  ] },
  { id: 'rune_reassembly', name: '逆着光读符文', reward: 30, icon: 'gem', lore: '符文并非召来力量，而是在给过载留一条退路。', steps: [
    questInspect('rune_order', 'portal', '调查法阵内环的符文走向', [
      ['narrator', '你沿内环慢慢走，符文的亮光总向脚步的相反方向流动。'],
      ['hero', '箭头不是朝出口，反而朝地下。'],
      ['narrator', '裂缝旁的第四个符文被铜锈挡住，擦开后是一道回流纹。'],
      ['hero', '四套稳流器，四道回流纹。应该一起读。'],
    ], '法阵内环 · 调查'),
    questDialogue('rune_explain', 'mentor', '请艾琳辨认回流纹', [
      ['mentor', '我们一直以为外环负责把人送回来。其实它还有第二个职责：送走多余的力量。'],
      ['hero', '向地下送，不会使地牢更危险吗？'],
      ['mentor', '力量应该在四处节点慢慢散去。缺了稳流器，就会只挤在最深的一处。'],
      ['mentor', '布洛克要按回流方向刻槽。任何人都别把铜环反着装。'],
    ]),
    questDialogue('rune_forge', 'smith', '把回流顺序交给布洛克', [
      ['smith', '难怪旧槽纹看起来刻反了。那不是工匠犯错，是我认错了进出口。'],
      ['hero', '现在能全部修好吗？'],
      ['smith', '铜环能做，地牢里的三个深层节点还堵着。先别许诺全镇一个好消息。'],
      ['smith', '你也得学会控制自己的力量。法阵要稳，人更要稳。'],
    ]),
  ] },
  { id: 'study', name: '传承之火', reward: 30, icon: 'book', lore: '导师传授的不是某一招，而是力量来去的分寸。', steps: [
    questDialogue('lesson_begin', 'mentor', '接受艾琳的控制力量课程', [
      ['mentor', '布洛克说得对。符文能引导力量，人的判断却没有铜槽替你挡住错误。'],
      ['hero', '需要学哪条天赋路线？'],
      ['mentor', '适合你的那条。我们不把所有人打成同一种剑刃。'],
      ['mentor', '累积五级天赋就够这次课程。已经学过的也算，你不需要把过去抹掉。'],
    ]),
    questOwned('talent_owned', 'talent', 5, '累计习得 5 级天赋'),
    questDialogue('lesson_close', 'mentor', '和艾琳复盘天赋学习', [
      ['mentor', '不错。知道自己会什么，也知道哪一步不能勉强。'],
      ['hero', '你看起来还是很担心。'],
      ['mentor', '外环的压力刚缓下来，地牢里的魔物却开始聚集。释放力量的地方变了。'],
      ['mentor', '去听听莉娅的防卫安排。接下来不只是你一个人的远行。'],
    ]),
  ] },
  { id: 'watchfires', name: '城门前的夜谈', reward: 30, icon: 'armor', lore: '守住镇子，靠的是每个人都知道自己要做哪件事。', steps: [
    questDialogue('defence_orders', 'guild', '与莉娅核对晨星镇防卫计划', [
      ['guild', '都到了？兽群开始往外聚，今晚要把孩子、补给和归途一起安排好。'],
      ['quartermaster', '我主张先封住镇口，把所有守卫集中起来。外面的商队可以等天亮。'],
      ['cook', '不能全封。还有送粮的人没回来，我们不能吃他们带来的粮，却把他们关在外面。'],
      ['mentor', '米洛说得对。留一条接应路，我守外环；雷恩分两班，别把人一次耗光。'],
      ['quartermaster', '那我重排轮换，接应路只放熟悉路线的人。前线得先把兽群打散。'],
      ['guild', '前线交给你。我们守归路，不让出征的人回来时只见一扇关上的门。'],
      ['guild', '米洛、雷恩，散会后各自核对整备。请你再走一趟，看看还有没有漏项。'],
    ], '公会门廊 · 四人防卫夜谈'),
    questDialogue('defence_food', 'cook', '核对米洛准备的应急餐食', [
      ['cook', '干粮已经分好，热汤留给轮换回来的人。真要撤，锅我也背得动。'],
      ['hero', '你还留着那张商队菜单。'],
      ['cook', '留着。等危机过去，总要有人记得平常日子吃什么。'],
      ['cook', '告诉莉娅，不必担心食堂。也别让雷恩漏吃饭，他一紧张就只记别人。'],
    ]),
    questDialogue('defence_guard', 'quartermaster', '提醒雷恩完成防卫轮换', [
      ['quartermaster', '路线、木桩、备用武器都点过了。轮换表……这确实没写。'],
      ['hero', '米洛说也要给你留一碗汤。'],
      ['quartermaster', '好，我把自己的名字也排进去。守卫熬倒了，就得让别人多守一轮。'],
      ['quartermaster', '外层聚集的兽群交给你。我们守住归路，等你回来。'],
    ]),
  ] },
  { id: 'invasion', name: '兽潮将至', reward: 40, icon: 'fang', lore: '地牢里的压力正在改变，晨星镇不能坐等它涌上来。', steps: [
    questDialogue('horde_brief', 'quartermaster', '领取雷恩的兽群侦察报告', [
      ['quartermaster', '敌人都在向同一个方向聚。它们不是冲我们来，是被什么逼出来。'],
      ['hero', '那还要清剿吗？'],
      ['quartermaster', '要。原因可以调查，镇口不能放任它们堆满。打散一百只，给防线腾出余地。'],
      ['quartermaster', '留意它们退向哪里。莉娅需要知道兽潮有没有继续扩大。'],
    ]),
    questEvent('horde_disperse', 'kill', 100, '击败 100 只地牢敌人，打散兽群'),
    questDialogue('horde_report', 'guild', '向莉娅汇报兽潮变化', [
      ['guild', '镇口已经不再挤着魔物了。雷恩终于能按表轮换，而不是整夜站着。'],
      ['hero', '它们似乎避开了有古老符文的地方。'],
      ['guild', '诺拉查到一处旧观测站，后来被当成祈愿神殿使用。也许还保留着稳定的符文。'],
      ['guild', '这次让调查走在战斗前面。去听她把线索说完整。'],
    ]),
  ] },
  { id: 'hidden_observatory', name: '祈愿所的旧名', reward: 35, icon: 'eye', lore: '许愿的人们并不知道，他们脚下原是一座观测站。', steps: [
    questDialogue('observatory_clue', 'archivist', '听诺拉讲述旧观测站', [
      ['archivist', '旧地图把祈愿神殿标作“压力观测所”。名字后来才改，建筑没搬。'],
      ['hero', '要去祈愿才能找到线索？'],
      ['archivist', '不用花钱。走进一间属性神殿，确认它的位置就够。我们查的是建筑，不是愿望。'],
      ['archivist', '艾琳会把它与镇上的脉动对照。她终于有另一处观测点了。'],
    ]),
    questEvent('observatory_visit', 'visit', 1, '进入 1 间属性神殿房', { type: 'shrine' }),
    questDialogue('observatory_report', 'mentor', '与艾琳对照神殿与法阵', [
      ['hero', '神殿的刻纹没有迟拍，位置也和旧地图相符。'],
      ['mentor', '那一带仍在正常泄流。不是整座地牢坏了，是几处关键节点出了问题。'],
      ['mentor', '我们可以把安全的地方连成路线，逐段往深处摸。'],
      ['mentor', '这回需要你清出更多房间，让诺拉的地图有足够的参照。'],
    ]),
  ] },
  { id: 'depths', name: '深入暗境', reward: 45, icon: 'eye', lore: '新的地图由脚步画成，不再把未知一概涂成黑色。', steps: [
    questDialogue('mapping_brief', 'mentor', '听艾琳安排深层路线测绘', [
      ['mentor', '十八间战斗房不是十八次逞强。每清出一处，商队和修理工就多一段可走的路。'],
      ['hero', '地图要一直画到最深处？'],
      ['mentor', '画到你能安全到达的地方。已经清出的房间会留下记录，不必一次做完。'],
      ['mentor', '别忘了回镇把路线交给诺拉。地图只有带回来，才帮得上别人。'],
    ]),
    questEvent('depth_mapping', 'clear', 18, '清理 18 间战斗房，补全深层路线'),
    questDialogue('mapping_review', 'archivist', '与诺拉整理新的深层地图', [
      ['archivist', '你画出的岔路绕开了旧石仓，还经过一间商店。这里有人长期生活过。'],
      ['hero', '我以为地牢里只有魔物和冒险者。'],
      ['archivist', '商人不会把摊位摆在没有归路的地方。沿着他们的足迹，也许能找到第七队的补给线。'],
      ['archivist', '我把这条线用蓝墨画上。接下来的问题，不能只向遗迹问。'],
    ]),
  ] },
  { id: 'echoes_below', name: '还在营业的道路', reward: 35, icon: 'coin', lore: '深处仍有交易，旧补给线没有完全死去。', steps: [
    questDialogue('merchant_route', 'archivist', '向诺拉了解深层补给线', [
      ['archivist', '第七队最后的补给回执不是公会盖章，是一枚商人的圆印。'],
      ['hero', '要向商人买下秘密吗？'],
      ['archivist', '不用。先进入一间商店房，确认这条路仍有人走。让事实先站住脚。'],
      ['archivist', '布洛克见过那种印章。回来请他认认，别让我的猜测变成你的保证。'],
    ]),
    questEvent('merchant_visit', 'visit', 1, '进入 1 间地牢商店房', { type: 'shop' }),
    questDialogue('merchant_mark', 'smith', '请布洛克辨认商路印记', [
      ['smith', '这印记我认得，老工坊换煤时也用过。商队仍走那条路，说明稳流器没全坏。'],
      ['hero', '有人还在维护它们？'],
      ['smith', '可能，也可能只是旧东西够结实。先别替远征队编结局。'],
      ['smith', '三个深层节点依旧被首领占着。要看清归途井的全貌，就得把它们逐一打开。'],
    ]),
  ] },
  { id: 'three_bosses', name: '折断王冠', reward: 60, icon: 'crown', lore: '被称作王座的地方，原来是三个堵塞的泄流口。', steps: [
    questDialogue('crowns_brief', 'guild', '和莉娅确认三处节点行动', [
      ['guild', '三位首领，对应三处被堵的节点。我们终于知道为什么要打这一仗。'],
      ['hero', '你会把真相写进委托吗？'],
      ['guild', '会。人们有权知道危险从哪来，也有权知道你为何出征。'],
      ['guild', '不要求同一次冒险完成。每打开一处，回来核对一次回声。'],
    ]),
    questEvent('crowns_battle', 'boss', 3, '击败 3 位地牢首领，疏通深层节点'),
    questDialogue('crowns_record', 'archivist', '把节点开放的消息交给诺拉', [
      ['archivist', '三处节点都开了，旧维护图终于能与现状叠在一起。'],
      ['hero', '第七队最后去了哪里？'],
      ['archivist', '归途井最底部。他们调低回流，把过载压住，才保住了上面的镇子。'],
      ['archivist', '英灵碑的留白该重读一次了。我们知道了驻守的地点，还缺那道命令的意思。'],
    ]),
  ] },
  { id: 'old_expedition', name: '最后一页不是告别', reward: 40, icon: 'book', lore: '第七队留下的命令，是给后来修复归途的人。', steps: [
    questInspect('stone_last_order', 'stele', '重读英灵碑侧面的归途训令', [
      ['narrator', '对照诺拉抄下的旧图，你辨认出石碑侧面曾被当成装饰的刻纹。'],
      ['hero', '“后来者勿断归路。接地、稳流、再开门。”'],
      ['narrator', '最末一句很浅：“灯若仍亮，便有人会回家。”'],
      ['hero', '这不是告别，是交接。'],
    ], '英灵碑 · 重读训令'),
    questDialogue('expedition_truth', 'archivist', '与诺拉还原第七队的最后命令', [
      ['archivist', '我请艾琳和布洛克都来看看。碑文、维护图和试铸铜环，现在终于摆在同一张桌上。'],
      ['smith', '这道槽没有封死，末端留了退路。他们当时要是想断门，根本不必费劲铸四套铜环。'],
      ['mentor', '对。缩小回流是争取时间，不是告别。老师口中的守阵人，确实走在队伍最后面。'],
      ['smith', '那档案里“远征覆灭”几个字得改。我不愿让认真做事的人被写成一次失败。'],
      ['archivist', '会改，但只能改成去向待查。我们能证明他们保住了归途，还不能证明他们现在活着。'],
      ['mentor', '诺拉说得对。别用我们的希望盖住留白，把他们留下的交接先完成。'],
      ['archivist', '我会公开这份会谈记录。请你把结论带给莉娅：归路可以修，队伍的命运仍要继续查。'],
    ], '档案书台 · 三人旧记录会谈'),
    questDialogue('expedition_promise', 'guild', '和莉娅约定新的远征目标', [
      ['guild', '我一直把灯当作等待的象征，原来它也是他们留下的交接信号。'],
      ['hero', '我们可以把归途重新打开。'],
      ['guild', '那就完整走过一幕，确认每一段都能回来。把英雄的传说留到以后，先把路修好。'],
      ['guild', '我会让所有人知道这次远征的理由。你背后有整个晨星镇。'],
    ]),
  ] },
  { id: 'act_clear', name: '黎明的见证', reward: 60, icon: 'feather', lore: '完整走过一幕，让修好的归途经受真正的远征。', steps: [
    questDialogue('dawn_brief', 'guild', '听莉娅发布归途验证远征', [
      ['guild', '路线图、铜环、餐食和轮换表都已备齐。现在只差一次完整远征来验证它们。'],
      ['hero', '哪一幕都可以吗？'],
      ['guild', '可以。先选你有把握的地方，把它完整走通，别因为委托催促就跳进陌生难度。'],
      ['guild', '回来以后，艾琳会核对一路的回流。灯会为你留着。'],
    ]),
    questEvent('dawn_expedition', 'win', 1, '完整通关任意一幕 1 次'),
    questDialogue('dawn_check', 'mentor', '与艾琳确认完整远征后的回流', [
      ['mentor', '这一回从出发到归来，外环没有漏掉一次脉动。修理确实奏效了。'],
      ['hero', '那晨星镇安全了吗？'],
      ['mentor', '眼前这条路安全得多。但困难暗境的压力更高，铜环还得经历一次更严的检验。'],
      ['mentor', '先让大家歇一夜。要不要继续，明天由我们一起决定。'],
    ]),
  ] },
  { id: 'council_of_dawn', name: '每个人的一票', reward: 40, icon: 'food', lore: '新的远征不由一个人下令，也不只由一个人承担。', steps: [
    questDialogue('council_food', 'cook', '听米洛对下一次远征的意见', [
      ['cook', '要往更危险的地方走，我不拦你。但出发前得吃饭，回来也得有饭。'],
      ['hero', '这算赞成？'],
      ['cook', '算有条件的赞成。我会备餐，也请你答应：累了就回来，不用向一口锅证明勇气。'],
      ['cook', '把这话也说给雷恩听，他准在算备用武器，却忘了休息。'],
    ], '食堂门前 · 居民议事'),
    questDialogue('council_supply', 'quartermaster', '听雷恩对压力测试的意见', [
      ['quartermaster', '备用武器足够，路段轮换也排好了。我赞成试，但不能同时把全部人送进去。'],
      ['hero', '米洛要你把休息也算进去。'],
      ['quartermaster', '算了。这回我的名字没漏。你承担前线，我们承担接应。'],
      ['quartermaster', '莉娅应该写清楚：这是修复后的压力测试，不是再找一支队伍去失踪。'],
    ]),
    questDialogue('council_resolution', 'guild', '参加莉娅主持的远征议事', [
      ['guild', '这次由大家当面决定。困难暗境的验证要继续，但谁都可以提出停下来的条件。'],
      ['quartermaster', '我先说：必须分批出发，留够接应。不能再让一支队伍承担所有人的赌注。'],
      ['mentor', '同意雷恩。回流一旦偏拍，我会通知撤回；战斗还没结束，也不能硬撑着验证。'],
      ['smith', '铜环的余量我测过，但不拿它保证万无一失。艾琳报异常，我就立刻停炉检查。'],
      ['cook', '那我把热汤留到最后一班回来。你们定的撤回条件，得让出发的人也听清楚。'],
      ['archivist', '我会把条件和结果全部公开。米洛说得对，风险不能只躺在公会的抽屉里。'],
      ['hero', '我听清楚了。我愿意去验证，也会按大家约定的条件撤回。'],
      ['guild', '通过。困难或更高暗境，完整走通一幕。前线由你承担，归途由我们一起守。'],
    ], '公会门廊 · 六位居民远征议事'),
  ] },
  { id: 'hard_clear', name: '不屈的晨星', reward: 60, icon: 'crown', lore: '更高压力之下，晨星镇仍能给远行的人留一条归路。', steps: [
    questDialogue('pressure_brief', 'mentor', '听艾琳交代高压暗境的注意事项', [
      ['mentor', '更高难度下，力量会更快累积。别把普通暗境的安全距离照搬过去。'],
      ['hero', '镇上的法阵能承受吗？'],
      ['mentor', '四道回流纹已经恢复，布洛克也留了余量。现在我们需要真实的验证。'],
      ['mentor', '在困难或更高难度完整通关一幕。每次撤退都可以保留任务，没人会把你赶回地牢。'],
    ]),
    questEvent('pressure_expedition', 'hardwin', 1, '在困难或更高难度完整通关一幕'),
    questDialogue('pressure_result', 'guild', '向莉娅报告压力测试结果', [
      ['guild', '艾琳确认回流稳定，布洛克说铜环一点没歪。雷恩已经让接应的人下班了。'],
      ['hero', '归途终于完整了。'],
      ['guild', '是大家把它接回来的。第七队争取到的时间，没有白等。'],
      ['guild', '最后去看看法阵吧，再听诺拉念一念新的记录。这份委托该有一个属于镇子的结尾。'],
    ]),
  ] },
  { id: 'light_for_the_return', name: '为归来的人留灯', reward: 50, icon: 'feather', lore: '答案没有替所有人画上句号，晨星镇却学会了继续守望。', steps: [
    questInspect('circle_restored', 'portal', '在法阵确认四道稳定的回流纹', [
      ['narrator', '四道回流纹依次亮起，外环与内环终于响在同一拍。'],
      ['hero', '不再有迟来的第二次心跳了。'],
      ['narrator', '铜环背面有布洛克新刻的一行小字：“修过，留图，后来者可再修。”'],
      ['hero', '这次我们不会只留下传说。'],
    ], '修复后的法阵 · 确认'),
    questDialogue('new_record', 'archivist', '听诺拉宣读新的归途记录', [
      ['archivist', '第七队：驻守归途井，保存回流，去向仍待查。晨星镇修复组：完成稳流与远征验证。'],
      ['hero', '你还保留着他们的留白。'],
      ['archivist', '保留。没有证据的结局，不应因为我们完成了任务就补上。'],
      ['archivist', '但今天这一页可以写满了。武器、饭菜、地图、灯光，每个人都有名字。'],
    ]),
    questDialogue('town_epilogue', 'guild', '回公会完成晨星镇的故事', [
      ['guild', '新的委托还会挂出来，商队也会继续远行。晨星镇不会因为一份任务完成就停止生活。'],
      ['hero', '那盏归途灯还留着吗？'],
      ['guild', '留着。为你，为路上的人，也为那些还没有答案的名字。'],
      ['guild', '下次出发前记得来报个平安。委托官莉娅，依旧负责等你回来。'],
    ], '公会门廊 · 归途灯下'),
  ] },
];
const CAMP_CONTRACTS = [
  { id: 'hunt', name: '清剿魔物', event: 'kill', goal: 30, reward: 20, icon: 'sword', col: '#ff9a80', desc: '击败 30 只地牢敌人', unit: '只', steps: [questEvent('hunt', 'kill', 30, '击败 30 只地牢敌人')] },
  { id: 'patrol', name: '扫清道路', event: 'clear', goal: 6, reward: 25, icon: 'boots', col: '#82e68c', desc: '清理 6 间战斗房', unit: '间', steps: [questEvent('patrol', 'clear', 6, '清理 6 间战斗房')] },
  { id: 'salvage', name: '遗物搜寻', event: 'chest', goal: 3, reward: 20, icon: 'gem', col: '#8ac8ff', desc: '打开 3 个地牢宝箱', unit: '个', steps: [questEvent('salvage', 'chest', 3, '打开 3 个地牢宝箱')] },
  { id: 'boss', name: '讨伐首领', event: 'boss', goal: 1, reward: 35, icon: 'skull', col: '#c8a0ff', desc: '击败 1 位地牢首领', unit: '位', steps: [questEvent('boss', 'boss', 1, '击败 1 位地牢首领')] },
  { id: 'horde', name: '肃清兽群', event: 'kill', goal: 80, reward: 50, icon: 'fang', col: '#ff9a80', desc: '击败 80 只地牢敌人', unit: '只', steps: [questEvent('horde', 'kill', 80, '击败 80 只地牢敌人')] },
  { id: 'expedition', name: '深处巡查', event: 'clear', goal: 12, reward: 55, icon: 'eye', col: '#82e68c', desc: '清理 12 间战斗房', unit: '间', steps: [questEvent('expedition', 'clear', 12, '清理 12 间战斗房')] },
  { id: 'supply_letter', name: '一封轮换便条', reward: 20, icon: 'book', col: '#e8c46a', desc: '替莉娅传递轮换消息，再向米洛确认', steps: [
    questDialogue('letter_take', 'guild', '向莉娅领取轮换便条', [
      ['guild', '雷恩又把自己的名字从轮换表里漏掉了。替我把这张便条送过去。'],
      ['hero', '你为什么不直接喊他？'],
      ['guild', '他一听到“军需官”就又想起十件没做完的事。亲手递给他，他才会停下来读。'],
    ]),
    questDialogue('letter_deliver', 'quartermaster', '把轮换便条交给雷恩', [
      ['quartermaster', '莉娅写的？“你也是需要休息的人”……字真重。'],
      ['hero', '她要你把自己排进轮换表。'],
      ['quartermaster', '好，第三班换我休息。去跟米洛说一声，他不用再追着我送饭。'],
    ]),
    questDialogue('letter_reply', 'cook', '向米洛确认雷恩的休息安排', [
      ['cook', '第三班？记住了。那时汤正好出锅。'],
      ['hero', '这次他把自己的名字写进去了。'],
      ['cook', '算你帮了食堂一个大忙。人肯坐下来，饭才叫吃进去了。'],
    ]),
  ] },
  { id: 'archive_note', name: '字迹里的记忆', reward: 20, icon: 'book', col: '#c8a0ff', desc: '帮助诺拉核对导师记得的旧称呼', steps: [
    questDialogue('note_request', 'archivist', '向诺拉领取待核对的旧笔记', [
      ['archivist', '这页笔记把法阵写成“回家圈”。我不知道是谁的口头说法。'],
      ['hero', '也许艾琳听过。'],
      ['archivist', '请问问她。我不想因为字写得随便，就把生活里的称呼当成错字划掉。'],
    ]),
    questDialogue('note_memory', 'mentor', '向艾琳核对“回家圈”的称呼', [
      ['mentor', '老师就是这么叫它的。孩子们记不住归途回流阵，回家圈好记。'],
      ['hero', '诺拉担心那是写错了。'],
      ['mentor', '替我告诉她，别改。严肃的东西也曾经是某个人的日常。'],
    ]),
    questDialogue('note_return', 'archivist', '把艾琳的解释交给诺拉', [
      ['archivist', '那我在旁边加注：“居民俗称”。原来的字保留。'],
      ['hero', '档案里也能留下这样的细节？'],
      ['archivist', '当然。只有军令和数字的镇子，读起来不像有人住过。'],
    ]),
  ] },
  { id: 'circle_check', name: '法阵日检', reward: 20, icon: 'gem', col: '#8ac8ff', desc: '调查法阵接缝，将观测结果交给艾琳', steps: [
    questInspect('daily_circle', 'portal', '检查法阵接缝与亮光节拍', [
      ['narrator', '你沿铜环检查接缝，记录每段亮光之间的间隔。'],
      ['hero', '接缝没有松动。把观察到的节拍交给艾琳。'],
      ['narrator', '你把结果写在便条上，没有把日常检查当成新的警报。'],
    ], '出征法阵 · 日检'),
    questDialogue('daily_report', 'mentor', '向艾琳交付法阵日检记录', [
      ['mentor', '有规律的记录，比只在出问题时跑来找我有用得多。'],
      ['hero', '每一段接缝都看过了。'],
      ['mentor', '谢谢。今天的结果我会和昨天放在一起，细小变化才不会藏过去。'],
    ]),
  ] },
  { id: 'memorial_rubbing', name: '碑文拓记', reward: 20, icon: 'feather', col: '#c8a0ff', desc: '调查英灵碑刻字，为诺拉保存拓记', steps: [
    questInspect('memorial_read', 'stele', '在英灵碑检查磨损的刻字', [
      ['narrator', '你用侧光辨认碑文，把浅刻的字一笔一笔记下。'],
      ['hero', '名字旁还有工匠、搬运和巡守的职责。'],
      ['narrator', '抄记上留下了完整职责，没有只抄下好听的头衔。'],
    ], '英灵碑 · 拓记'),
    questDialogue('memorial_return', 'archivist', '把碑文抄记交给诺拉', [
      ['archivist', '这一份比旧抄本清楚。职责也记下来了，很好。'],
      ['hero', '这些人当时做的事，也应该留下。'],
      ['archivist', '是。我们记住的不能只剩一个名字和一个结局。'],
    ]),
  ] },
  { id: 'board_copy', name: '委托板整理', reward: 20, icon: 'book', col: '#e8c46a', desc: '调查委托板，将失效便条交莉娅核对', steps: [
    questInspect('board_sort', 'board', '在委托板核对日期和重复便条', [
      ['narrator', '委托板贴着新旧不同的纸，你按日期逐一核对。'],
      ['hero', '这里有两张相同的补给通知，旧的还没有撤下。'],
      ['narrator', '你记下编号，准备让委托官确认后再整理。'],
    ], '公会委托板 · 整理'),
    questDialogue('board_return', 'guild', '请莉娅核对委托板整理记录', [
      ['guild', '是我漏撤的。旧便条留太久，会让商队白跑一趟。'],
      ['hero', '编号和日期都在这里。'],
      ['guild', '谢谢。这种不会写进英雄传的事，往往最能帮人。'],
    ]),
  ] },
  { id: 'warm_meal', name: '热汤整备', reward: 20, icon: 'food', col: '#ff9a80', desc: '向食堂预订暖胃炖汤，再交代出征安排', steps: [
    questEvent('warm_order', 'meal', 1, '预订 1 次暖胃炖汤', { id: 'hearty' }),
    questDialogue('warm_confirm', 'cook', '和米洛确认热汤整备', [
      ['cook', '暖胃炖汤订好了。我把要添热水的时间也记上。'],
      ['hero', '你怎么知道什么时候出发？'],
      ['cook', '所以还得当面确认呀。纸上选好一份餐，不等于人已经吃过饭。'],
    ]),
  ] },
  { id: 'bow_practice', name: '弓弦的距离', reward: 25, icon: 'bow', col: '#82e68c', desc: '整备短弓，用短弓命中营地木桩 8 次', steps: [
    questEvent('bow_select', 'starter', 1, '在军需官处选择短弓', { id: 'shortbow' }),
    questEvent('bow_train', 'practice', 8, '用短弓命中训练木桩 8 次', { id: 'shortbow' }),
    questDialogue('bow_review', 'quartermaster', '请雷恩复盘短弓训练', [
      ['quartermaster', '命中八次，够看清你的习惯了。松弦后别立刻把手压下去。'],
      ['hero', '距离比近战难判断。'],
      ['quartermaster', '那就先留退路，再留射程。弓手的稳，不是站着不动。'],
    ]),
  ] },
  { id: 'blade_practice', name: '握柄与重心', reward: 25, icon: 'sword', col: '#ff9a80', desc: '整备手斧，用手斧命中营地木桩 8 次', steps: [
    questEvent('axe_select', 'starter', 1, '在军需官处选择手斧', { id: 'hatchet' }),
    questEvent('axe_train', 'practice', 8, '用手斧命中训练木桩 8 次', { id: 'hatchet' }),
    questDialogue('axe_review', 'smith', '请布洛克检查训练后的手斧', [
      ['smith', '握柄磨痕偏一侧，说明你总在落斧时拧手腕。'],
      ['hero', '斧头有问题吗？'],
      ['smith', '斧头没问题，姿势能改。先让重心帮你，别让手腕替整条胳膊硬撑。'],
    ]),
  ] },
  { id: 'shrine_survey', name: '神殿路标', reward: 25, icon: 'gem', col: '#8ac8ff', desc: '找到 2 间属性神殿房，向诺拉报告路线', steps: [
    questEvent('shrine_find', 'visit', 2, '进入 2 间属性神殿房', { type: 'shrine' }),
    questDialogue('shrine_report', 'archivist', '向诺拉交付神殿路线记录', [
      ['archivist', '两处神殿，记好了。我会把它们标为旅人可以停留的地点。'],
      ['hero', '不必祈愿也有用？'],
      ['archivist', '知道哪里能暂歇，本身就是有用的消息。'],
    ]),
  ] },
  { id: 'trader_supply', name: '流动的补给', reward: 30, icon: 'coin', col: '#ffd060', desc: '在地牢商店或神殿累计花费 120 金币', steps: [
    questEvent('supply_spend', 'goldspend', 120, '在地牢商店 / 神殿消费 120 金币'),
    questDialogue('supply_receipt', 'quartermaster', '向雷恩核对地牢补给使用', [
      ['quartermaster', '补给有花出去，路才会有人继续维护。但别为了报酬买用不到的东西。'],
      ['hero', '商店和神殿的花费都记在这里。'],
      ['quartermaster', '收到了。我们看的是实际成交，不把路过一家店当成补给到位。'],
    ]),
  ] },
  { id: 'field_catalogue', name: '旅人的新见闻', reward: 25, icon: 'book', col: '#c8a0ff', desc: '接取后发现 3 件从未见过的装备；集齐图鉴可直接核对', steps: [
    questEvent('catalogue_find', 'discover', 3, '接取后发现 3 件新装备（图鉴全收集可核对）'),
    questDialogue('catalogue_return', 'archivist', '与诺拉核对新增装备见闻', [
      ['archivist', '新图样收到了。我会把外形和用途分开记录，免得后来人只认名字。'],
      ['hero', '如果已经把图鉴收满呢？'],
      ['archivist', '那就核对已有的完整记录。学习不是逼你去发现不存在的新东西。'],
    ]),
  ] },
  { id: 'workshop_review', name: '图纸会诊', reward: 25, icon: 'hammer', col: '#ffb060', desc: '携带 2 张已解锁图纸，与布洛克讨论工艺', steps: [
    questOwned('workshop_owned', 'blueprint', 2, '拥有 2 张已解锁的装备图纸'),
    questDialogue('workshop_compare', 'smith', '与布洛克核对两份图纸的工艺', [
      ['smith', '两份图纸摆在一起，才能看出哪些尺寸是通用的，哪些不能照抄。'],
      ['hero', '这些图纸我可能早就解锁了。'],
      ['smith', '早学会也是本事。工坊请你来讨论，不是让你重复交钱。'],
    ]),
  ] },
  { id: 'fountain_route', name: '让伤者找到水', reward: 25, icon: 'heart', col: '#82e68c', desc: '受伤后实际使用一次治愈泉，再向米洛记录位置', steps: [
    questEvent('fountain_use', 'heal', 1, '在受伤时使用治愈泉，实际恢复生命', { source: 'fountain' }),
    questDialogue('fountain_report', 'cook', '向米洛报告可用的治愈泉', [
      ['cook', '活着的泉眼，好消息。我会把这处写在送给商队的路线便条上。'],
      ['hero', '泉水确实帮我恢复了伤势。'],
      ['cook', '那才算查实。看见一座泉台，和确认它还在起作用，是两回事。'],
    ]),
  ] },
  { id: 'altar_ledger', name: '献祭的代价', reward: 30, icon: 'gem', col: '#ff9a80', desc: '实际使用一次生命祭坛，向艾琳记录交换的代价', steps: [
    questDialogue('altar_warning', 'mentor', '先听艾琳说明生命祭坛的风险', [
      ['mentor', '祭坛的馈赠要用生命换取。这项调查不是命令，你可以随时放弃。'],
      ['hero', '为什么需要记录？'],
      ['mentor', '让后来人知道代价。若你本来就要使用祭坛，记下真实交换；别只为魂晶伤害自己。'],
    ]),
    questEvent('altar_use', 'altar', 1, '成功完成 1 次生命祭坛交换（可放弃此任务）'),
    questDialogue('altar_report', 'mentor', '向艾琳记录生命祭坛的真实代价', [
      ['mentor', '记下了。我会把警告与馈赠写在一起，不让它只剩一句诱人的传闻。'],
      ['hero', '选择确实需要付出生命。'],
      ['mentor', '这次报告够了。以后是否使用，仍由你按自己的状态判断。'],
    ]),
  ] },
];
// Preserve the compact description used by the service list as well as the full ordered journal.
const QUEST_PREVIOUS_MAIN_LENGTH = CAMP_MAIN.length;
if (typeof buildCampaignExpansion === 'function') CAMP_MAIN.push(...buildCampaignExpansion());
if (typeof buildSideQuestExpansion === 'function') CAMP_CONTRACTS.push(...buildSideQuestExpansion());
for (const q of CAMP_MAIN) {
  q.arc = q.arc || '晨星往事';
  q.desc = q.steps[0].label;
  const action = q.steps.find(s => s.type === 'owned' || s.type === 'event' && s.event !== 'inspect');
  q.event = action ? action.event : 'dialogue'; q.goal = action ? action.goal : q.steps.length;
}
for (const [i, q] of CAMP_CONTRACTS.entries()) {
  if (!q.goal) q.goal = q.steps.length; if (!q.event) q.event = 'story';
  q.repeatable = q.repeatable === undefined ? i < 6 : !!q.repeatable;
  q.owner = q.owner || (q.steps.find(s => s.type === 'dialogue') || {}).npc || 'guild';
}

const QUEST_LEGACY_MAIN_IDS = ['greeting', 'first_hunt', 'path', 'relics', 'guardian', 'forge', 'study', 'invasion', 'depths', 'three_bosses', 'act_clear', 'hard_clear'];
const QUEST_NPC_MENUS = { guild: 'guild', mentor: 'talent', smith: 'armory', quartermaster: 'quartermaster', cook: 'cook', archivist: 'archivist' };
const questCount = n => Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
const questToken = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const questGoal = step => step && step.type !== 'dialogue' ? Math.max(1, questCount(step.goal)) : 1;
function questOwnedCount(event) {
  if (event === 'blueprint') return ITEMS.filter(i => i.lock && META.unlockedSet.has(i.id)).length;
  if (event === 'talent') return TALENTS.reduce((n, t) => n + Math.min(t.max, questCount(lv(t.id))), 0);
  if (event === 'discover') return codexItems().filter(i => META.seenSet.has(i.id)).length;
  return 0;
}
function questCatalogueComplete() {
  const all = codexItems(); return all.length > 0 && all.every(i => META.seenSet.has(i.id));
}
function refreshQuestState(q, state) {
  if (!q || !state || state.accepted === false) return;
  // Only ownership can satisfy existing progress. Conversations and investigations always need confirmation.
  while (state.step < q.steps.length) {
    const step = q.steps[state.step], goal = questGoal(step);
    if (q.id === 'greeting' && step.type === 'dialogue' && Array.isArray(state.legacyTalks) &&
        state.legacyTalks.includes(step.id === 'meet_mentor' ? 'talent' : step.id === 'meet_smith' ? 'armory' : '')) {
      state.step++; state.progress = 0; continue;
    }
    if (step.type === 'owned') state.progress = Math.min(goal, questOwnedCount(step.event));
    else if (step.event === 'discover' && questCatalogueComplete()) state.progress = goal;
    if (state.progress < goal) break;
    state.step++; state.progress = 0;
  }
}
function normalizeQuestEntry(q, raw) {
  const source = raw && typeof raw === 'object' ? raw : {}, step = Math.min(q.steps.length, questCount(source.step));
  const state = { id: q.id, step, progress: step < q.steps.length ? Math.min(questGoal(q.steps[step]), questCount(source.progress)) : 0,
    token: typeof source.token === 'string' && source.token ? source.token : questToken() };
  refreshQuestState(q, state); return state;
}
function normalizeQuestState(rawCamp) {
  const raw = rawCamp && typeof rawCamp === 'object' && !Array.isArray(rawCamp) ? rawCamp : {};
  const old = raw.main && typeof raw.main === 'object' && !Array.isArray(raw.main) ? raw.main : {};
  let stage, step = 0, progress = 0, legacyTalks = [], continueCampaign = false;
  const modern = questCount(raw.ver) >= 2;
  if (modern) {
    legacyTalks = Array.isArray(old.legacyTalks) ? [...new Set(old.legacyTalks.filter(id => id === 'talent' || id === 'armory'))] : [];
    const byId = CAMP_MAIN.findIndex(q => q.id === old.chapterId);
    const previousEnd = questCount(raw.ver) >= 3 ? CAMP_MAIN.length : QUEST_PREVIOUS_MAIN_LENGTH;
    const finished = old.chapterId === null && questCount(old.stage) >= previousEnd;
    stage = finished ? previousEnd : byId >= 0 ? byId : Math.min(previousEnd, questCount(old.stage));
    continueCampaign = finished && stage < CAMP_MAIN.length;
    if (stage < CAMP_MAIN.length && !continueCampaign) {
      step = Math.min(CAMP_MAIN[stage].steps.length, questCount(old.step));
      progress = step < CAMP_MAIN[stage].steps.length ? Math.min(questGoal(CAMP_MAIN[stage].steps[step]), questCount(old.progress)) : 0;
    }
  } else {
    const legacy = Math.min(QUEST_LEGACY_MAIN_IDS.length, questCount(old.stage));
    stage = legacy >= QUEST_LEGACY_MAIN_IDS.length ? QUEST_PREVIOUS_MAIN_LENGTH : CAMP_MAIN.findIndex(q => q.id === QUEST_LEGACY_MAIN_IDS[legacy]);
    continueCampaign = legacy >= QUEST_LEGACY_MAIN_IDS.length && stage < CAMP_MAIN.length;
    if (old.accepted && stage < CAMP_MAIN.length && !continueCampaign) {
      const q = CAMP_MAIN[stage];
      if (q.id === 'greeting') {
        const talks = Array.isArray(old.talks) ? old.talks : [];
        legacyTalks = [...new Set(talks.filter(id => id === 'talent' || id === 'armory'))];
        // The old greeting only tracked the mentor and smith. Existing meetings retain their meaning.
        step = talks.includes('talent') && talks.includes('armory') ? q.steps.length : talks.includes('talent') ? 2 : 1;
      } else {
        step = q.steps.findIndex(s => s.type === 'event' || s.type === 'owned');
        if (step < 0) step = 0;
        progress = Math.min(questGoal(q.steps[step]), questCount(old.progress));
      }
    }
  }
  const main = { stage, chapterId: stage < CAMP_MAIN.length ? CAMP_MAIN[stage].id : null, accepted: stage < CAMP_MAIN.length && (!!old.accepted || continueCampaign),
    step, progress, legacyTalks, token: typeof old.token === 'string' && old.token ? old.token : questToken(), completed: CAMP_MAIN.slice(0, stage).map(q => q.id) };
  if (!main.accepted) { main.step = 0; main.progress = 0; }
  refreshQuestState(CAMP_MAIN[stage], main);
  const sideCompleted = Array.isArray(raw.sideCompleted) ? [...new Set(raw.sideCompleted.filter(id => CAMP_CONTRACTS.some(q => q.id === id && !q.repeatable)))] : [];
  const source = Array.isArray(raw.contracts) ? raw.contracts : raw.contract ? [raw.contract] : [], contracts = [];
  for (const entry of source) {
    const q = entry && CAMP_CONTRACTS.find(q => q.id === entry.id);
    if (!q || sideCompleted.includes(q.id) || contracts.some(j => j.id === q.id) || contracts.length >= 3) continue;
    contracts.push(normalizeQuestEntry(q, entry));
  }
  return { main, contracts, sideCompleted };
}
function questMainCurrent() { const m = townCamp().main; return m.stage < CAMP_MAIN.length ? CAMP_MAIN[m.stage] : null; }
function questStepLabel(q, state) {
  if (!q || !state) return '等待接取';
  refreshQuestState(q, state);
  return state.step >= q.steps.length ? '返回公会交付' : q.steps[state.step].label;
}
function questProgress(q, state) {
  if (!q) return { step: 0, total: 0, current: 0, goal: 0, ready: false, label: '主线已完成' };
  const s = state || { step: 0, progress: 0, accepted: false }; refreshQuestState(q, s);
  const at = Math.min(q.steps.length, questCount(s.step)), objective = q.steps[at];
  return { step: at, total: q.steps.length, current: objective ? Math.min(questGoal(objective), questCount(s.progress)) : 0,
    goal: objective ? questGoal(objective) : 0, ready: s.accepted !== false && at >= q.steps.length, label: objective ? objective.label : '返回公会交付' };
}
function questReady(q, state) { return !!q && !!state && questProgress(q, state).ready; }
function acceptMainQuest() {
  if (!metaSaveReady()) return false;
  const m = townCamp().main, q = CAMP_MAIN[m.stage];
  if (G.mode !== 'town' || !q || m.accepted) return false;
  m.accepted = true; m.chapterId = q.id; m.step = 0; m.progress = 0; m.legacyTalks = []; m.token = questToken(); refreshQuestState(q, m); saveMeta(); return true;
}
function claimMainQuest() {
  if (!metaSaveReady()) return false;
  const camp = townCamp(), m = camp.main, q = CAMP_MAIN[m.stage];
  if (G.mode !== 'town' || !questReady(q, m)) return false;
  // Advance before saving the reward. The same chapter and scene can never be rewarded twice.
  m.completed.push(q.id); m.stage++; m.chapterId = m.stage < CAMP_MAIN.length ? CAMP_MAIN[m.stage].id : null;
  m.accepted = m.stage < CAMP_MAIN.length; m.step = 0; m.progress = 0; m.legacyTalks = []; m.token = questToken();
  META.souls += q.reward; refreshQuestState(CAMP_MAIN[m.stage], m);
  if (TOWN.sel) TOWN.sel.guildMain = Math.min(m.stage, CAMP_MAIN.length - 1);
  saveMeta(); return true;
}
function acceptSideQuest(id) {
  if (!metaSaveReady()) return false;
  const camp = townCamp(), q = CAMP_CONTRACTS.find(q => q.id === id);
  if (G.mode !== 'town' || !q || camp.contracts.length >= 3 || camp.contracts.some(s => s.id === id) || !q.repeatable && camp.sideCompleted.includes(id)) return false;
  camp.contracts.push(normalizeQuestEntry(q, { step: 0, progress: 0, token: questToken() })); saveMeta(); return true;
}
function abandonSideQuest(id) {
  if (!metaSaveReady()) return false;
  const jobs = townCamp().contracts, at = jobs.findIndex(s => s.id === id);
  if (G.mode !== 'town' || at < 0) return false;
  jobs.splice(at, 1); saveMeta(); return true;
}
function claimSideQuest(id) {
  if (!metaSaveReady()) return false;
  const camp = townCamp(), jobs = camp.contracts, state = jobs.find(s => s.id === id), q = CAMP_CONTRACTS.find(q => q.id === id);
  if (G.mode !== 'town' || !questReady(q, state)) return false;
  jobs.splice(jobs.indexOf(state), 1);
  if (!q.repeatable) camp.sideCompleted.push(q.id);
  META.souls += q.reward; saveMeta(); return true;
}
function questActiveEntries() {
  const camp = townCamp(), q = CAMP_MAIN[camp.main.stage], entries = [];
  if (q && camp.main.accepted) entries.push({ scope: 'main', q, state: camp.main });
  for (const state of camp.contracts) { const q = CAMP_CONTRACTS.find(q => q.id === state.id); if (q) entries.push({ scope: 'side', q, state }); }
  return entries;
}
function questEventAllowed(kind) {
  if (kind === 'talk' || kind === 'inspect') return false;
  if (['meal', 'starter', 'practice', 'blueprint', 'talent'].includes(kind)) return G.mode === 'town';
  if (!G.room || G.room.type === 'town') return false;
  if (kind === 'win' || kind === 'hardwin') return G.mode === 'win';
  if (kind === 'discover' || kind === 'goldspend') return ['play', 'choice', 'chest', 'shrine'].includes(G.mode);
  if (kind === 'altar') return G.mode === 'play' || G.mode === 'choice';
  return G.mode === 'play';
}
function questEventMatches(step, payload) {
  if (!step.match) return true;
  const val = typeof payload === 'string' ? { id: payload, type: payload } : payload && typeof payload === 'object' ? payload : {};
  return Object.entries(step.match).every(([key, wanted]) => val[key] === wanted);
}
function recordQuestEvent(kind, payload) {
  if (!questEventAllowed(kind)) return;
  // Region context comes from the actual run, so early-act actions cannot satisfy later expeditions.
  const given = typeof payload === 'string' ? { id: payload, type: payload } : typeof payload === 'number' ? { amount: payload } : payload && typeof payload === 'object' ? payload : {};
  const data = { act: G.act, chapter: G.chapter, floor: G.floor, diff: G.diff, type: G.room && G.room.type, ...given };
  let changed = false, completed = false;
  for (const { q, state } of questActiveEntries()) {
    const before = `${state.step}:${state.progress}`; refreshQuestState(q, state);
    const step = q.steps[state.step];
    if (step && step.type === 'event' && step.event === kind && questEventMatches(step, data)) {
      const amount = kind === 'goldspend' ? questCount(data.amount) : 1;
      if (amount) state.progress = Math.min(questGoal(step), state.progress + amount);
      refreshQuestState(q, state);
    }
    if (before !== `${state.step}:${state.progress}`) { changed = true; if (questReady(q, state)) completed = true; }
  }
  if (completed && G.mode === 'play' && G.player && typeof addFloat === 'function') addFloat(G.player.x, G.player.y - 28, '委托完成 · 回公会领取', '#ffd060', true);
  if (changed) saveMeta();
}
function questScene(entry) {
  const { q, state, scope } = entry; refreshQuestState(q, state); const step = q.steps[state.step];
  if (!step || !(step.type === 'dialogue' || step.type === 'event' && step.event === 'inspect')) return null;
  return { id: `${scope}:${q.id}:${state.token}:${step.id}`, questId: q.id, scope, stepId: step.id,
    npc: QUEST_NPC_MENUS[step.npc] || step.target, title: step.setting || q.name, objective: step.label,
    inspect: step.event === 'inspect' ? step.target : null, lines: step.lines };
}
function questInteractionEntries() {
  const entries = questActiveEntries(), tracker = townCamp().tracker;
  const at = tracker ? entries.findIndex(e => `${e.scope}:${e.q.id}` === tracker.focus) : -1;
  if (at > 0) entries.unshift(entries.splice(at, 1)[0]);
  return entries;
}
function pendingQuestDialogue(npcMenu) {
  if (G.mode !== 'town') return null;
  const menu = QUEST_NPC_MENUS[npcMenu] || npcMenu;
  for (const entry of questInteractionEntries()) { const scene = questScene(entry); if (scene && !scene.inspect && scene.npc === menu) return scene; }
  return null;
}
function pendingQuestInspect(key) {
  if (G.mode !== 'town') return null;
  for (const entry of questInteractionEntries()) { const scene = questScene(entry); if (scene && scene.inspect === key) return scene; }
  return null;
}
function finishQuestDialogue(scene) {
  if (!metaSaveReady()) return false;
  if (G.mode !== 'town' || !scene || typeof scene.id !== 'string') return false;
  const entry = questActiveEntries().find(e => e.scope === scene.scope && e.q.id === scene.questId);
  const expected = entry && questScene(entry);
  if (!expected || expected.id !== scene.id || expected.stepId !== scene.stepId) return false;
  entry.state.step++; entry.state.progress = 0; refreshQuestState(entry.q, entry.state); saveMeta(); return true;
}
