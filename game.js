
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const TYPES=[
{k:'bridge',s:'BRIDGE',n:'Command Bridge',max:80,d:'Targeting and battle management. Damage lowers accuracy. If it is destroyed, the fortress falls.'},
{k:'gun',s:'GUNS',n:'Gun Deck',max:70,d:'Principal artillery. Fires automatically at the target room. Destroyed means no firing.'},
{k:'boiler',s:'BOILER',n:'Boiler Room',max:60,d:'Steam pressure. Damage slows reload times.'},
{k:'work',s:'SHOP',n:'Workshop',max:50,d:'Repairs the room you order, but crew must walk there first. Damage slows repairs.'},
{k:'barr',s:'BARRACKS',n:'Barracks',max:50,d:'Crew quarters. Crew count falls with damage and slows repairs.'},
{k:'aeth',s:'AETHER',n:'Aether Chamber',max:40,d:'Experimental network interface. Dormant in this prototype: no gameplay effect yet.'}];
const PRESETS={quick:{n:'Quick',rl:.7,acc:.8},bal:{n:'Balanced',rl:1,acc:1},prec:{n:'Precision',rl:1.4,acc:1.2}};
const WEAPONS={shell:{n:'Shell Launcher',dmg:18,rl:3.5,acc:.65,fly:1.3,arc:45,col:'#e8b04a'},rapid:{n:'Rapid Turret',dmg:10,rl:1.8,acc:.6,fly:.8,arc:12,col:'#ffd36a'},lob:{n:'Arc Lobber',dmg:23,rl:6,acc:.55,fly:1.9,arc:85,col:'#7fb2e8'},siege:{n:'Heavy Siege Cannon',dmg:38,rl:12,acc:.7,fly:1.6,arc:40,col:'#e8704a',splash:.4}};
const nbrs=i=>[i^1,i-2,i+2].filter(j=>j>=0&&j<6);
const BASE=['#2a3a46','#3a2d1c','#4a2a14','#33291a','#2f2a22','#3b2a5a'];
let pushed=false,speed=1,S,paused=false,running=false,sel={s:'p',i:1},last=0,els={p:[],e:[]};
function mk(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function pos(side,i){const col=i%2,row=Math.floor(i/2);const c=side==='e'?1-col:col;return{x:(side==='p'?8:216)+c*70,y:50+row*50,w:66,h:46}}
function frac(r){return r.hp/r.max}
function newSide(p){return{rooms:TYPES.map((t,i)=>({hp:p?t.max*(i===2?.7:.85):t.max,max:t.max,fl:0})),cd:p?1.5:2.5,preset:'bal',weapon:'shell',manual:false,target:1,repair:null,fired:0,hits:0,working:0,crew:Array.from({length:p?3:2},(_,k)=>{const q=pos(p?'p':'e',3);return{x:q.x+14+k*19,y:q.y+45,w:0}})}}
function buildScene(){
const sv=$('svg');sv.innerHTML='';
const d=mk('defs',{},sv),g=mk('linearGradient',{id:'sky',x1:0,y1:0,x2:0,y2:1},d);
mk('stop',{offset:0,'stop-color':'#0f1218'},g);mk('stop',{offset:.75,'stop-color':'#8a4a26'},g);mk('stop',{offset:1,'stop-color':'#d98a3a'},g);
mk('rect',{width:360,height:230,fill:'url(#sky)'},sv);
mk('circle',{cx:180,cy:192,r:34,fill:'#f0b050',opacity:.3},sv);mk('path',{d:'M0 190 L40 140 L70 165 L115 120 L160 170 L200 150 L250 175 L300 135 L360 180 V204 H0Z',fill:'#1a1410'},sv);mk('ellipse',{cx:90,cy:70,rx:15,ry:4.5,fill:'#1a1410'},sv);mk('ellipse',{cx:270,cy:84,rx:11,ry:3.5,fill:'#1a1410'},sv);mk('rect',{y:204,width:360,height:26,fill:'#0e0b08'},sv);
for(let x=0;x<360;x+=12)mk('rect',{x,y:208,width:6,height:3,fill:'#3a2d1c'},sv);
mk('text',{x:180,y:20,'text-anchor':'middle',fill:'#9a8c74','font-size':9},sv).textContent='NORTHERN ASHLANDS RAIL CORRIDOR';
[['p',4,'IRON CROWN'],['e',212,'VANGUARD']].forEach(([s,x,nm])=>{
mk('rect',{x,y:44,width:144,height:156,rx:4,fill:'#2b2218',stroke:'#6b5638'},sv);
mk('rect',{x:x+(s==='p'?100:20),y:26,width:12,height:18,fill:'#3a2d1c',stroke:'#6b5638'},sv);
mk('text',{x:x+72,y:38,'text-anchor':'middle',fill:s==='p'?'#c8923a':'#b8442f','font-size':9,'font-weight':'bold'},sv).textContent=nm;
for(let w=0;w<5;w++)mk('circle',{cx:x+16+w*28,cy:202,r:7,fill:'#14110e',stroke:'#6b5638'},sv)});
['p','e'].forEach(s=>{els[s]=[];TYPES.forEach((t,i)=>{const q=pos(s,i);
const g=mk('g',{class:'room'},sv);
const r=mk('rect',{x:q.x,y:q.y,width:q.w,height:q.h,rx:3,stroke:'#6b5638','stroke-width':1.5},g);
const tx=mk('text',{x:q.x+q.w/2,y:q.y+17,'text-anchor':'middle','font-size':9,'font-weight':'bold',fill:'#e8dcc4'},g);tx.textContent=t.s;
mk('rect',{x:q.x+6,y:q.y+30,width:q.w-12,height:6,fill:'#0e0b08'},g);
const b=mk('rect',{x:q.x+6,y:q.y+30,width:q.w-12,height:6},g);
const mark=mk('text',{x:q.x+q.w-5,y:q.y+11,'text-anchor':'end','font-size':9,fill:'#c8923a'},g);
g.addEventListener('click',()=>pick(s,i));
els[s].push({r,b,mark,tx})})});
['p','e'].forEach(s=>{S[s].crewEls=S[s].crew.map(()=>{const g=mk('g',{},sv);mk('circle',{cx:0,cy:-7,r:2.2,fill:'#e8dcc4'},g);mk('rect',{x:-1.6,y:-5,width:3.2,height:5.5,fill:s==='p'?'#c8923a':'#b8442f'},g);const sp=mk('circle',{cx:4,cy:-3,r:1.4,fill:'#ffd36a',opacity:0},g);return{g,sp}})});
mk('g',{id:'pj'},sv)}
function pick(s,i){sel={s,i};if(s==='e')S.p.target=i}
function startBattle(){
S={p:newSide(1),e:newSide(0),projs:[],t:0,log:['Battle joined. Imperial fortress in range.'],over:false};
S.p.repair=2;if(!pushed){try{history.pushState({g:1},'')}catch(e){}pushed=true}sel={s:'p',i:1};paused=false;running=true;$('over').classList.add('hidden');$('pause').textContent='Pause';speed=1;$('speed').textContent='Speed 1x';$('quit').classList.add('hidden');
buildScene();show('game')}
function show(id){['title','game','result'].forEach(x=>$(x).classList.toggle('hidden',x!==id))}
function say(m){S.log.unshift(m);S.log.length=Math.min(S.log.length,5)}
function reloadMul(side){return 1/(0.4+0.6*frac(side.rooms[2]))}
function accMul(side){return .7+.3*frac(side.rooms[0])}
function fire(from,to,fs,ts,ti,q){
const w=WEAPONS[fs.weapon],pr=PRESETS[fs.preset],pl=fs===S.p;q=q||1;
fs.cd=w.rl*pr.rl*reloadMul(fs);fs.fired++;
const hit=Math.random()<Math.min(.97,w.acc*pr.acc*accMul(fs)*q);
const a=pos(pl?'p':'e',1),b=pos(pl?'e':'p',ti);
S.projs.push({t:0,dur:w.fly,hit,ts,ti,fs,w,x1:a.x+33,y1:a.y+23,x2:b.x+33,y2:b.y+23,el:mk('circle',{r:w.splash?4:3,fill:w.col},$('pj'))});
say((pl?'Iron Crown':'Imperial guns')+' fires '+w.n+' at '+TYPES[ti].n+'.')}
function manualFire(){if(!S||!running||paused||!S.p.manual)return;const P=S.p;if(P.cd>0||P.rooms[1].hp<=0||P.rooms[0].hp<=0)return;
const q=.75+.5*(1-Math.abs(Math.sin(S.t*2.4)));fire(0,0,P,S.e,P.target,q);say('Aim quality '+Math.round((q-.75)*200)+'%.')}
function step(dt){
S.t+=dt;const P=S.p,E=S.e;
[P,E].forEach(s=>s.rooms.forEach(r=>{if(r.fl>0)r.fl-=dt}));
// player + enemy fire
[[P,E],[E,P]].forEach(([a,b])=>{
if(a.rooms[1].hp>0&&a.rooms[0].hp>0){a.cd-=dt;
if(a.cd<=0&&!(a===P&&P.manual)){let ti=a.target;
if(a===E){const alive=b.rooms.map((r,i)=>i).filter(i=>b.rooms[i].hp>0);ti=Math.random()<.35&&b.rooms[1].hp>0?1:alive[Math.floor(Math.random()*alive.length)]}
if(a===E)E.weapon=['shell','shell','rapid','lob','siege'][Math.floor(Math.random()*5)];fire(0,0,a,b,ti)}}});
// repairs
const rep=(s,side,i,rate)=>{const r=i>=0?s.rooms[i]:null;const need=!!r&&s.rooms[3].hp>0&&r.hp<r.max;const n=crewStep(s,side,dt,need?i:-1);s.working=need?n:0;if(need&&n>0)r.hp=Math.min(r.max,r.hp+n*rate*frac(s.rooms[3])*(.5+.5*frac(s.rooms[4]))*dt)};
rep(P,'p',P.repair===null?-1:P.repair,1.2);
let w=-1,wf=2;E.rooms.forEach((r,i)=>{if(r.hp<r.max&&frac(r)<wf){wf=frac(r);w=i}});rep(E,'e',w,1.3);
// projectiles
for(let k=S.projs.length-1;k>=0;k--){const p=S.projs[k];p.t+=dt/p.dur;
if(p.t>=1){const r=p.ts.rooms[p.ti];
if(p.hit){const dmg=p.w.dmg*(.8+Math.random()*.4);r.hp=Math.max(0,r.hp-dmg);r.fl=.3;p.fs.hits++;killCrew(p.ts,p.ts===E?'e':'p',p.ti);if(p.w.splash)nbrs(p.ti).forEach(j=>{const o=p.ts.rooms[j];o.hp=Math.max(0,o.hp-dmg*p.w.splash);o.fl=.3;killCrew(p.ts,p.ts===E?'e':'p',j)});
say((p.ts===E?'Hit on enemy ':'Iron Crown hit: ')+TYPES[p.ti].n+(r.hp<=0?' DISABLED':'')+'.')}
else say('A shell lands wide of the '+TYPES[p.ti].n+'.');
p.el.remove();S.projs.splice(k,1)}}
// end
if(P.rooms[0].hp<=0)return end('lose');
if(E.rooms[0].hp<=0)return end('win');
if(P.rooms[1].hp<=0&&E.rooms[1].hp<=0&&!S.projs.length)return end('draw')}
function end(k){S.over=true;running=false;
const T={win:['VICTORY','The enemy bridge is silent. The rail corridor is open.'],lose:['DEFEAT','The Iron Crown\'s bridge is lost.'],draw:['STALEMATE','Both gun decks are silenced.']}[k];
$('rtitle').textContent=T[0];$('rtext').textContent=T[1];
const ob=(t,ok)=>'<div class="ob'+(ok?'':' no')+'">'+(ok?'&#10003; ':'&#10007; ')+t+'</div>';$('rtitle').style.color=k==='win'?'#6fc24a':k==='lose'?'#b8442f':'#c8923a';$('rstats').innerHTML=ob('Destroy enemy bridge',S.e.rooms[0].hp<=0)+ob('Disable enemy gun deck',S.e.rooms[1].hp<=0)+ob('Survive the battle',S.p.rooms[0].hp>0)+'<br>Time: '+S.t.toFixed(0)+'s<br>Your shells: '+S.p.fired+' fired, '+S.p.hits+' hit<br>Enemy shells: '+S.e.fired+' fired, '+S.e.hits+' hit';
show('result')}
function hull(s){const rs=S[s].rooms;let h=0,m=0;rs.forEach(r=>{h+=r.hp;m+=r.max});$('hb'+s).style.width=(h/m*100)+'%';$('hb'+s).style.background=s==='p'?'#6f9a4a':'#b8442f';$('ht'+s).textContent='Hull '+Math.ceil(h)+' / '+m}
function killCrew(s,side,i){const q=pos(side,i);let d=0;s.crew.forEach(c=>{if(!c.dead&&c.x>=q.x&&c.x<=q.x+q.w&&c.y>=q.y&&c.y<=q.y+q.h&&Math.random()<.4){c.dead=true;c.dt=S.t;d++;say((side==='p'?'Crew member killed in the ':'Enemy crew member killed in the ')+TYPES[i].n+'!')}});if(d&&!s.crew.some(c=>!c.dead))say((side==='p'?'All your crew are dead':'Enemy crew wiped out')+' - no more repairs.')}
function crewStep(s,side,dt,tgt){let n=0;s.crew.forEach((c,k)=>{if(c.dead)return;const q=pos(side,tgt>=0?tgt:3),tx=q.x+14+k*19,ty=q.y+45,v=34*dt;c.w=0;
if(Math.abs(c.y-ty)>1){c.y+=Math.sign(ty-c.y)*Math.min(v,Math.abs(ty-c.y));c.w=1}
else if(Math.abs(c.x-tx)>1){c.x+=Math.sign(tx-c.x)*Math.min(v,Math.abs(tx-c.x));c.w=1}
else if(tgt>=0)n++});return n}
function crewDraw(){['p','e'].forEach(s=>{const o=S[s];o.crew.forEach((c,k)=>{const e=o.crewEls[k];if(c.dead){e.g.setAttribute('opacity',Math.max(0,1-(S.t-c.dt)));return}const bob=c.w?-Math.abs(Math.sin(S.t*14+k))*1.5:0;e.g.setAttribute('transform','translate('+c.x+','+(c.y+bob)+')');e.sp.setAttribute('opacity',(!c.w&&o.working>0&&Math.floor(S.t*8)%2)?1:0)})})}
function col(f){return f>.6?'#6f9a4a':f>.3?'#c8923a':'#b8442f'}
function render(){
if(!S)return;
['p','e'].forEach(s=>S[s].rooms.forEach((r,i)=>{const e=els[s][i],f=frac(r);
e.r.setAttribute('fill',r.hp<=0?'#120e0a':r.fl>0?'#7a3a28':BASE[i]);
e.b.setAttribute('width',60*0+Math.max(0,f)*54);e.b.setAttribute('fill',col(f));
let st='#6b5638',sw=1.5;
if(sel.s===s&&sel.i===i){st='#e8dcc4';sw=2.5}
if(s==='e'&&S.p.target===i){st='#b8442f';sw=3}
e.r.setAttribute('stroke',st);e.r.setAttribute('stroke-width',sw);
e.mark.textContent=(s==='p'&&S.p.repair===i?'+':'')+(r.hp<=0?'X':'')}));
S.projs.forEach(p=>{const t=p.t;p.el.setAttribute('cx',p.x1+(p.x2-p.x1)*t);p.el.setAttribute('cy',p.y1+(p.y2-p.y1)*t-p.w.arc*Math.sin(Math.PI*t))});
const T=TYPES[sel.i],r=S[sel.s].rooms[sel.i],own=sel.s==='p';
let x='<b>'+(own?'Iron Crown: ':'Enemy: ')+T.n+'</b><div class="bar"><i style="width:'+(frac(r)*100)+'%;background:'+col(frac(r))+'"></i></div>HP '+Math.ceil(r.hp)+'/'+r.max+(r.hp<=0?' (DISABLED)':'')+'<br><small>'+T.d+'</small>';
if(sel.i===4)x+='<br><small>Crew: '+Math.ceil(12*frac(r))+'/12</small>';
if(sel.i===2&&own)x+='<br><small>Reload speed: '+Math.round(100/reloadMul(S.p))+'%</small>';
if(sel.i===0&&own)x+='<br><small>Accuracy modifier: '+Math.round(accMul(S.p)*100)+'%</small>';
$('info').innerHTML=x;hull('p');hull('e');crewDraw();
document.querySelectorAll('#presets .btn').forEach(b=>b.classList.toggle('on',b.dataset.k===S.p.preset));document.querySelectorAll('#weapons .btn').forEach(b=>b.classList.toggle('on',b.dataset.k===S.p.weapon));

const PP=S.p,can=PP.rooms[1].hp>0&&PP.rooms[0].hp>0;$('mode').textContent='Fire: '+(PP.manual?'Manual':'Auto');$('aim').classList.toggle('hidden',!PP.manual);$('needle').style.left=(50+48*Math.sin(S.t*2.4))+'%';$('fire').disabled=!(PP.manual&&!paused&&can&&PP.cd<=0);$('fire').textContent=!PP.manual?'FIRE (manual only)':paused?'Paused':!can?'Guns down':PP.cd>0?'Reloading':'FIRE';
$('rep').disabled=sel.s!=='p';
$('rep').textContent=S.p.repair===sel.i&&own?'Repairing: '+T.s:'Repair '+(own?T.s:'(pick your room)');
$('log').innerHTML='<b>Status</b> Crew repairing: '+S.p.working+', alive: '+S.p.crew.filter(c=>!c.dead).length+'/'+S.p.crew.length+'. '+(S.p.rooms[1].hp<=0?'<span style="color:#b8442f">Guns down. </span>':'')+'Target: '+TYPES[S.p.target].n+' | '+WEAPONS[S.p.weapon].n+' ('+PRESETS[S.p.preset].n+')'+(S.p.cd>0?', ready in '+S.p.cd.toFixed(1)+'s':', READY')+'<br>'+S.log.join('<br>')}
function frame(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
if(running&&!paused)step(dt*speed);if(running)render();requestAnimationFrame(frame)}
$('play').onclick=startBattle;$('restart').onclick=startBattle;$('quit').onclick=()=>{running=false;paused=false;show('title');if(pushed){try{history.back()}catch(e){}}};$('speed').onclick=()=>{speed=speed===1?2:1;$('speed').textContent='Speed '+speed+'x'};
$('rep').onclick=()=>{if(sel.s==='p'){S.p.repair=sel.i;say('Workshop ordered to repair '+TYPES[sel.i].n+'.')}};
$('pause').onclick=()=>{if(!running)return;paused=!paused;$('over').classList.toggle('hidden',!paused);$('quit').classList.toggle('hidden',!paused);$('pause').textContent=paused?'Resume':'Pause'};
requestAnimationFrame(frame);

document.querySelectorAll('#presets .btn').forEach(b=>b.onclick=()=>{if(S){S.p.preset=b.dataset.k;say('Calibration: '+PRESETS[b.dataset.k].n+'.')}});
document.querySelectorAll('#weapons .btn').forEach(b=>b.onclick=()=>{if(S){S.p.weapon=b.dataset.k;say('Weapon: '+WEAPONS[b.dataset.k].n+'.')}});
$('mode').onclick=()=>{if(S){S.p.manual=!S.p.manual;say(S.p.manual?'Manual fire: tap FIRE with the needle centered.':'Auto fire.')}};
$('fire').onclick=manualFire;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)$('pause').onclick()});
window.addEventListener('popstate',()=>{if(running&&!paused){$('pause').onclick();try{history.pushState({g:1},'')}catch(e){}return}pushed=false;running=false;paused=false;show('title')});
