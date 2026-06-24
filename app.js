const $ = (s) => document.querySelector(s);
const scheduleEl = $('#schedule'), mobileScheduleEl = $('#mobileSchedule'), dialog = $('#courseDialog');
const DAYS = ['一','二','三','四','五','六','日'];
let cursor = new Date(); cursor.setHours(0,0,0,0);
let mobileDayIndex = (new Date().getDay()+6)%7;
let mobileView = 'day';
let data = JSON.parse(localStorage.getItem('holiday-course-data') || '{"courses":[],"records":{},"notes":{}}');

function key(date){ const d=new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function dateFromKey(value){ return new Date(value + 'T00:00:00'); }
function formatDate(date){ return `${date.getMonth()+1}月${date.getDate()}日`; }
function monday(date){ const d = new Date(date); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d; }
function save(){ localStorage.setItem('holiday-course-data', JSON.stringify(data)); }
function normalize(course){ if(!course.startDate){ const d=course.date; course.startDate=d; course.endDate=d; course.weekdays=[dateFromKey(d).getDay()]; delete course.date; } return course; }
data.courses.forEach(normalize);
function coursesOn(date){ const k = key(date), day = date.getDay(); return data.courses.filter(c => c.startDate <= k && c.endDate >= k && c.weekdays.includes(day)).sort((a,b)=>a.start.localeCompare(b.start)); }
function recordKey(course,date){ return `${course.id}-${key(date)}`; }
function minutes(time){ const [h,m]=time.split(':').map(Number); return h*60+m; }

function render(){
  const start = monday(cursor), dates = Array.from({length:7}, (_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
  $('#weekRange').textContent = `${formatDate(dates[0])} — ${formatDate(dates[6])}`;
  const todayKey = key(new Date());
  let html = '<div class="time-label">时段</div>' + dates.map((d,i)=>`<div class="day-head ${key(d)===todayKey?'today':''}">${DAYS[i]}<b>${d.getDate()}</b></div>`).join('');
  const periods=[{name:'上午',start:480,end:720,time:'08:00'},{name:'下午',start:780,end:1020,time:'13:00'},{name:'晚上',start:1050,end:1440,time:'17:30'}];
  periods.forEach(period=>{
    html += `<div class="time-label period-label">${period.name}</div>`;
    dates.forEach(d=>{const list=coursesOn(d).filter(c=>minutes(c.start)<period.end && minutes(c.end)>period.start);html += `<div class="grid-cell period-cell" data-date="${key(d)}" data-time="${period.time}">${list.map(c=>`<button class="course-chip ${c.color}" data-id="${c.id}">${c.name}<small>${c.start}–${c.end}</small></button>`).join('')}</div>`});
  });
  scheduleEl.innerHTML = html;
  const allWeek = dates.flatMap(coursesOn); $('#weekCount').textContent = allWeek.length;
  $('#doneCount').textContent = Object.values(data.records).filter(Boolean).length;
  renderMobileSchedule(dates); renderToday(); renderRecord(); renderScheduleList();
}
function renderMobileSchedule(dates){
  const date=dates[mobileDayIndex]||dates[0], periods=[{name:'上午',start:480,end:720,time:'08:00'},{name:'下午',start:780,end:1020,time:'13:00'},{name:'晚上',start:1050,end:1440,time:'17:30'}];
  const periodCards=(day,compact=false)=>periods.map(p=>{const list=coursesOn(day).filter(c=>minutes(c.start)<p.end&&minutes(c.end)>p.start);return `<section class="mobile-period ${compact?'week-period':''}"><h3>${p.name}</h3><div>${list.length?list.map(c=>`<button class="mobile-course ${c.color}" data-id="${c.id}"><span>${c.name}</span><small>${c.start}–${c.end}</small></button>`).join(''):`<button class="mobile-empty" data-mobile-add="${p.time}" data-mobile-date="${key(day)}">＋ 添加课程</button>`}</div></section>`}).join('');
  const switcher=`<div class="mobile-view-switch"><button class="${mobileView==='day'?'active':''}" data-mobile-view="day">日视图</button><button class="${mobileView==='week'?'active':''}" data-mobile-view="week">周视图</button></div>`;
  const dayTabs=`<div class="mobile-days">${dates.map((d,i)=>`<button class="${i===mobileDayIndex?'active':''}" data-mobile-day="${i}"><span>周${DAYS[i]}</span><b>${d.getDate()}</b></button>`).join('')}</div>`;
  const content=mobileView==='day'?`${dayTabs}<div class="mobile-periods">${periodCards(date)}</div>`:`<div class="mobile-week-list">${dates.map((d,i)=>`<section class="mobile-week-day"><button class="mobile-week-heading ${i===mobileDayIndex?'today':''}" data-mobile-day="${i}">周${DAYS[i]} · ${d.getMonth()+1}月${d.getDate()}日 <span>查看当天 ›</span></button><div class="mobile-periods">${periodCards(d,true)}</div></section>`).join('')}</div>`;
  mobileScheduleEl.innerHTML=switcher+content;
}
function renderToday(){ const today=new Date(), list=coursesOn(today); $('#todayDate').textContent=`${today.getMonth()+1}月${today.getDate()}日 · 星期${DAYS[(today.getDay()+6)%7]}`; $('#todayCourses').textContent=list.length?list.map(c=>`${c.start} ${c.name}`).join('  ·  '):'今天没有安排课程，好好放松吧！'; }
function renderRecord(){ const date=dateFromKey($('#recordDate').value), k=key(date), list=coursesOn(date); $('#noteInput').value=data.notes[k]||''; $('#recordList').innerHTML=list.length?list.map(c=>{const rk=recordKey(c,date);return `<div class="record-item ${data.records[rk]?'done':''}"><input type="checkbox" data-record="${rk}" ${data.records[rk]?'checked':''}><span class="record-copy"><span class="record-time">${c.start}–${c.end}</span><span class="record-name">${c.name}</span></span></div>`}).join(''):'<p class="empty">这天没有课程安排</p>'; }
function renderScheduleList(){ const dayNames=['周日','周一','周二','周三','周四','周五','周六']; const list=[...data.courses].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')); $('#scheduleList').innerHTML=list.length?list.map(c=>`<div class="schedule-item"><span class="schedule-dot ${c.color}"></span><span class="schedule-copy"><b>${c.name}</b><small>${c.startDate} 至 ${c.endDate} · ${c.weekdays.map(d=>dayNames[d]).join('、')} · ${c.start}–${c.end}</small></span><span class="schedule-actions"><button type="button" data-schedule-edit="${c.id}">修改</button><button type="button" data-schedule-delete="${c.id}">删除</button></span></div>`).join(''):'<p class="empty">还没有添加日程</p>'; }
function deleteSchedule(id){ const schedule=data.courses.find(c=>c.id===id); if(!schedule || !confirm(`确定删除日程“${schedule.name}”吗？`)) return; data.courses=data.courses.filter(c=>c.id!==id); Object.keys(data.records).filter(k=>k.startsWith(`${id}-`)).forEach(k=>delete data.records[k]); save(); render(); }
function openCourse(course, prefill={}){ const c=course||{}, defaultDate=prefill.date||key(new Date()), defaultDay=dateFromKey(defaultDate).getDay(); $('#dialogTitle').textContent=course?'编辑日程':'添加日程'; $('#editingId').value=c.id||''; $('#courseName').value=c.name||''; $('#startDate').value=c.startDate||defaultDate; $('#endDate').value=c.endDate||defaultDate; document.querySelectorAll('#weekdayOptions input').forEach(i=>i.checked=(c.weekdays||[defaultDay]).includes(Number(i.value))); $('#startTime').value=c.start||prefill.start||'09:00'; $('#endTime').value=c.end||'10:00'; $('#courseColor').value=c.color||'orange'; $('#courseNote').value=c.note||''; $('#deleteCourse').style.display=course?'block':'none'; dialog.showModal(); }

$('#addCourse').onclick=()=>openCourse(); $('#closeDialog').onclick=()=>dialog.close();
$('#prevWeek').onclick=()=>{cursor.setDate(cursor.getDate()-7);render()}; $('#nextWeek').onclick=()=>{cursor.setDate(cursor.getDate()+7);render()};
document.querySelectorAll('.season').forEach(btn=>btn.onclick=()=>{document.querySelector('.season.active').classList.remove('active');btn.classList.add('active');});
scheduleEl.onclick=(e)=>{const chip=e.target.closest('.course-chip'); if(chip){openCourse(data.courses.find(c=>c.id===chip.dataset.id));return} const cell=e.target.closest('.grid-cell');if(cell)openCourse(null,{date:cell.dataset.date,start:cell.dataset.time});};
mobileScheduleEl.onclick=(e)=>{const view=e.target.closest('[data-mobile-view]'), day=e.target.closest('[data-mobile-day]'), chip=e.target.closest('.mobile-course'), add=e.target.closest('[data-mobile-add]'); if(view){mobileView=view.dataset.mobileView;render();return} if(day){mobileDayIndex=Number(day.dataset.mobileDay); const selected=monday(cursor); selected.setDate(selected.getDate()+mobileDayIndex); $('#recordDate').value=key(selected); if(mobileView==='week')mobileView='day'; render();return} if(chip){openCourse(data.courses.find(c=>c.id===chip.dataset.id));return} if(add)openCourse(null,{date:add.dataset.mobileDate,start:add.dataset.mobileAdd});};
$('#recordDate').onchange=renderRecord; $('#recordList').onchange=(e)=>{if(e.target.dataset.record){data.records[e.target.dataset.record]=e.target.checked;save();render();}};
$('#scheduleList').onclick=(e)=>{const edit=e.target.closest('[data-schedule-edit]'), remove=e.target.closest('[data-schedule-delete]'); if(edit)openCourse(data.courses.find(c=>c.id===edit.dataset.scheduleEdit)); if(remove)deleteSchedule(remove.dataset.scheduleDelete);};
$('#saveNote').onclick=()=>{data.notes[$('#recordDate').value]=$('#noteInput').value.trim();save();$('#saveNote').textContent='已保存 ✓';setTimeout(()=>$('#saveNote').textContent='保存小记',1200)};
$('#courseForm').onsubmit=(e)=>{e.preventDefault();const id=$('#editingId').value, weekdays=[...document.querySelectorAll('#weekdayOptions input:checked')].map(i=>Number(i.value));const c={id:id||crypto.randomUUID(),name:$('#courseName').value.trim(),startDate:$('#startDate').value,endDate:$('#endDate').value,weekdays,start:$('#startTime').value,end:$('#endTime').value,color:$('#courseColor').value,note:$('#courseNote').value.trim()};if(c.endDate<c.startDate){alert('结束日期不能早于开始日期');return}if(!weekdays.length){alert('请至少选择一个上课日');return}if(id)data.courses=data.courses.map(x=>x.id===id?c:x);else data.courses.push(c);save();const selectedDate=dateFromKey(c.startDate);cursor=selectedDate;mobileDayIndex=(selectedDate.getDay()+6)%7;$('#recordDate').value=c.startDate;dialog.close();render();};
$('#deleteCourse').onclick=()=>{const id=$('#editingId').value;dialog.close();deleteSchedule(id);};
$('#recordDate').value=key(new Date());
if(!data.courses.length){ const d=monday(new Date()); [[0,'09:00','少儿英语','blue'],[1,'10:00','钢琴课','purple'],[3,'15:00','篮球训练','orange'],[5,'10:00','创意美术','pink']].forEach(([offset,start,name,color])=>{const date=new Date(d);date.setDate(d.getDate()+offset);data.courses.push({id:crypto.randomUUID(),name,startDate:key(date),endDate:key(date),weekdays:[date.getDay()],start,end:String(Number(start.slice(0,2))+1).padStart(2,'0')+start.slice(2),color,note:''})});save();}
render();
