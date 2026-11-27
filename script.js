(function(){
var $=function(s){return document.querySelector(s)},$$=function(s){return document.querySelectorAll(s)};
var pages=['inicio','unidades','agendar','consultas','cadastro','problema','solucao','funcionalidades','acessibilidade','como-funciona','sobre'];
var names={'inicio':'Início','unidades':'Unidades','agendar':'Agendar','consultas':'Minhas consultas','cadastro':'Meu cadastro','problema':'O problema','solucao':'A solução','funcionalidades':'Funcionalidades','acessibilidade':'Acessibilidade','como-funciona':'Como funciona','sobre':'Sobre'};
var DIAS=['dom','seg','ter','qua','qui','sex','sáb'];
/* Dados FICTÍCIOS: só hospitais públicos e UBS */
var UNITS=[
{id:'h1',tipo:'Hospital público',nome:'Hospital Público Exemplo – Municipal',end:'[Endereço]',esp:['Clínico geral','Cardiologia','Ortopedia','Pediatria','Ginecologia'],dias:[1,2,3,4,5],ini:'07:00',fim:'17:00'},
{id:'h2',tipo:'Hospital público',nome:'Hospital Público Exemplo – Regional',end:'[Endereço]',esp:['Clínico geral','Oftalmologia','Neurologia','Cirurgia geral'],dias:[1,3,5],ini:'08:00',fim:'16:00'},
{id:'b1',tipo:'UBS',nome:'UBS Exemplo – Centro',end:'[Endereço]',esp:['Clínico geral','Enfermagem','Odontologia','Vacinação'],dias:[1,2,3,4,5],ini:'08:00',fim:'16:00'},
{id:'b2',tipo:'UBS',nome:'UBS Exemplo – Bairro Norte',end:'[Endereço]',esp:['Clínico geral','Pediatria','Pré-natal'],dias:[1,3,5],ini:'09:00',fim:'15:00'},
{id:'b3',tipo:'UBS',nome:'UBS Exemplo – Zona Sul',end:'[Endereço]',esp:['Clínico geral','Ginecologia','Odontologia'],dias:[2,4],ini:'08:00',fim:'12:00'}];
function ld(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function hear(){return user&&((user.nec||[]).indexOf('Deficiência auditiva')>-1||(user.nec||[]).indexOf('Usa Libras')>-1)}
var user=ld('ib_user',null),appts=ld('ib_appts_v2',[]),prefs=ld('ib_prefs',{z:0,dark:false}),editId=null,preUn=null,first=true;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function unit(id){return UNITS.filter(function(u){return u.id===id})[0]}
function num(h){return +h.slice(0,2)*60+ +h.slice(3)}
function hhmm(m){return('0'+Math.floor(m/60)).slice(-2)+':'+('0'+m%60).slice(-2)}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function when(a){var p=a.data.split('-');return new Date(+p[0],+p[1]-1,+p[2],+a.hora.slice(0,2),+a.hora.slice(3))}
function fmtD(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function dias(u){return u.dias.map(function(d){return DIAS[d]}).join(', ')}
function say(m){var t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(say.t);say.t=setTimeout(function(){t.hidden=true},6000)}
function flash(){if(!prefs.alert)return;var b=document.body;b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash');setTimeout(function(){b.classList.remove('flash')},3000);try{if(navigator.vibrate)navigator.vibrate([300,150,300,150,300])}catch(e){}}
function notify(m){say(m);flash();try{if('Notification' in window&&Notification.permission==='granted')new Notification('IncluiBem',{body:m})}catch(e){}}
function active(){var n=new Date();return appts.filter(function(a){return a.st!=='Cancelada'&&when(a)>n}).sort(function(a,b){return when(a)-when(b)})}

function slots(u,date,ignore){
var p=date.split('-'),dow=new Date(+p[0],+p[1]-1,+p[2]).getDay();
if(u.dias.indexOf(dow)<0)return null;
var taken=appts.filter(function(a){return a.un===u.id&&a.data===date&&a.st!=='Cancelada'&&a.id!==ignore}).map(function(a){return a.hora});
var out=[],now=new Date();
for(var m=num(u.ini);m<num(u.fim);m+=30){var s=hhmm(m);if(taken.indexOf(s)>-1)continue;if(new Date(+p[0],+p[1]-1,+p[2],Math.floor(m/60),m%60)<=now)continue;out.push(s)}
return out}

/* Unidades */
function rUn(){var f=$('#fEsp').value,t=$('#fTipo').value;
$('#listaUnidades').innerHTML=UNITS.filter(function(u){return(!f||u.esp.indexOf(f)>-1)&&(!t||u.tipo===t)}).map(function(u){
return '<div class="c"><div><span class="pill'+(u.tipo==='UBS'?'':' ok')+'">'+esc(u.tipo)+'</span></div><h3 class="t">'+esc(u.nome)+'</h3><p class="p">'+esc(u.end)+'</p><p class="p"><strong>Especialidades:</strong> '+esc(u.esp.join(', '))+'</p><p class="p"><strong>Atendimento:</strong> '+dias(u)+', das '+u.ini+' às '+u.fim+'</p><div><a class="b" href="#agendar" data-un="'+u.id+'">Agendar aqui</a></div></div>'}).join('')}

/* Agendar */
function rAg(){
var us=$('#aUn');if(!us.options.length)us.innerHTML=UNITS.map(function(u){return '<option value="'+u.id+'">'+esc(u.nome)+'</option>'}).join('');
var u=unit(us.value),es=$('#aEsp'),cur=es.value;
es.innerHTML=u.esp.map(function(s){return '<option>'+esc(s)+'</option>'}).join('');if(u.esp.indexOf(cur)>-1)es.value=cur;
var di=$('#aData');di.min=today();
var hs=$('#aHora'),d=di.value,info=$('#aInfo');
if(!d){hs.innerHTML='<option value="">Escolha a data primeiro</option>';info.textContent='Atendimento: '+dias(u)+', das '+u.ini+' às '+u.fim+'.';return}
var sl=slots(u,d,editId);
if(sl===null){hs.innerHTML='<option value="">Sem atendimento neste dia</option>';info.textContent='Esta unidade não atende neste dia. Atendimento: '+dias(u)+'.';return}
if(!sl.length){hs.innerHTML='<option value="">Sem horários livres</option>';info.textContent='Não há horários livres nesta data.';return}
hs.innerHTML=sl.map(function(s){return '<option>'+s+'</option>'}).join('');info.textContent=sl.length+' horário(s) livre(s).'}
function agUI(){var e=!!editId;$('#agTit').textContent=e?'Remarcar consulta':'Agendar consulta';$('#agBtn').textContent=e?'Confirmar nova data':'Confirmar agendamento';$('#agCan').hidden=!e;$('#aOrigW').hidden=!$('#aTr').checked}
function resetAg(){editId=null;$('#fAg').reset();$('#aMsg').textContent='';agUI()}
function prefill(){var a=appts.filter(function(x){return x.id===editId})[0];if(!a){editId=null;return}
$('#aUn').value=a.un;rAg();$('#aEsp').value=a.esp;$('#aData').value=a.data;rAg();$('#aHora').value=a.hora;
$('#aTr').checked=!!(a.tr&&a.tr.st==='Solicitado');$('#aLib').checked=!!a.lib;$('#aOrig').value=a.tr?a.tr.origem:'';agUI()}
function sub60(h){return hhmm(Math.max(0,num(h)-60))}
$('#aUn').onchange=rAg;$('#aData').onchange=rAg;
$('#aTr').onchange=function(){$('#aOrigW').hidden=!this.checked;if(this.checked&&!$('#aOrig').value&&user&&user.end)$('#aOrig').value=user.end};
$('#agCan').onclick=function(){resetAg();location.hash='consultas'};
$('#fAg').addEventListener('submit',function(e){e.preventDefault();var m=$('#aMsg');
if(!user){say('Faça seu cadastro antes de agendar.');location.hash='cadastro';return}
var u=unit($('#aUn').value),d=$('#aData').value,h=$('#aHora').value;
if(!d||!h){m.textContent='Escolha uma data e um horário disponíveis.';return}
var tr=$('#aTr').checked,or=$('#aOrig').value.trim();
if(tr&&!or){m.textContent='Informe o endereço de partida para o transporte.';return}
var rec={id:editId||('a'+Date.now()),un:u.id,esp:$('#aEsp').value,data:d,hora:h,st:'Agendada',tr:tr?{origem:or,busca:sub60(h),st:'Solicitado'}:null,lib:$('#aLib').checked,r24:false,r1:false};
var was=editId;
if(was){rec.rem=true;appts=appts.map(function(x){return x.id===was?rec:x})}else appts.push(rec);
sv('ib_appts_v2',appts);editId=null;$('#fAg').reset();agUI();m.textContent='';
say(was?'Consulta remarcada.':'Consulta agendada!');location.hash='consultas';check()});

/* Minhas consultas */
function rCons(){var L=$('#listaCons'),now=new Date();
var arr=appts.slice().sort(function(a,b){return when(a)-when(b)});
if(!arr.length){L.innerHTML='<div class="c"><p class="p">Você ainda não tem consultas.</p><div><a class="b" href="#agendar">Agendar agora</a></div></div>';nst();return}
L.innerHTML=arr.map(function(a){var u=unit(a.un)||{nome:'Unidade'},canc=a.st==='Cancelada',past=!canc&&when(a)<now;
var st=canc?'Cancelada':past?'Realizada':a.rem?'Remarcada':'Agendada',cl=canc?' no':past?'':' ok';
var tr=a.tr?'<p class="p"><strong>Transporte:</strong> '+a.tr.st+(a.tr.st==='Solicitado'?' · busca às '+a.tr.busca+' em '+esc(a.tr.origem):'')+'</p>':'<p class="p"><strong>Transporte:</strong> não solicitado</p>';
var act=(canc||past)?'':'<div class="row" style="margin-top:8px"><button class="b b2" data-act="rem" data-id="'+a.id+'">Remarcar</button><button class="b b2" data-act="can" data-id="'+a.id+'">Cancelar consulta</button>'+(a.tr&&a.tr.st==='Solicitado'?'<button class="b b2" data-act="ctr" data-id="'+a.id+'">Cancelar transporte</button>':'')+'</div>';
return '<div class="c"><div><span class="pill'+cl+'">'+st+'</span></div><h3 class="t">'+esc(a.esp)+'</h3><p class="p">'+cap(fmtD(a.data))+' às '+a.hora+'<br>'+esc(u.nome)+'</p>'+tr+(a.lib?'<p class="p"><strong>Intérprete de Libras:</strong> solicitado</p>':'')+act+'</div>'}).join('');nst()}
document.addEventListener('click',function(e){
var t=e.target.closest('[data-un]');if(t){preUn=t.getAttribute('data-un');return}
var b=e.target.closest('[data-act]');if(!b)return;
var id=b.getAttribute('data-id'),act=b.getAttribute('data-act'),a=appts.filter(function(x){return x.id===id})[0];if(!a)return;
if(act==='rem'){editId=id;location.hash='agendar';return}
if(b.getAttribute('data-sure')!=='1'){var old=b.textContent;b.setAttribute('data-sure','1');b.textContent='Confirmar: '+old.toLowerCase();setTimeout(function(){if(b.isConnected){b.setAttribute('data-sure','0');b.textContent=old}},4000);return}
if(act==='can'){a.st='Cancelada';if(a.tr)a.tr.st='Cancelado';say('Consulta cancelada.')}
if(act==='ctr'){a.tr.st='Cancelado';say('Transporte cancelado.')}
sv('ib_appts_v2',appts);rCons();rHome();rBan()});

/* Cadastro */
function rCad(){if(!user)return;$('#cNome').value=user.nome||'';$('#cTel').value=user.tel||'';$('#cMail').value=user.mail||'';$('#cEnd').value=user.end||'';$('#cCont').value=user.cont||'';
$$('input[name=nec]').forEach(function(c){c.checked=(user.nec||[]).indexOf(c.value)>-1});$('#cOla').textContent='Olá, '+user.nome+'! Seu cadastro está salvo. Você pode editar abaixo.'}
$('#fCad').addEventListener('submit',function(e){e.preventDefault();var n=$('#cNome').value.trim();
if(!n){$('#cMsg').textContent='Informe seu nome.';return}
var nec=[];$$('input[name=nec]').forEach(function(c){if(c.checked)nec.push(c.value)});
user={nome:n,tel:$('#cTel').value.trim(),mail:$('#cMail').value.trim(),end:$('#cEnd').value.trim(),cont:$('#cCont').value,nec:nec};sv('ib_user',user);
$('#cMsg').textContent='Cadastro salvo!';say('Cadastro salvo.');rCad()});
$('#cApagar').onclick=function(){var b=this;
if(b.getAttribute('data-sure')!=='1'){b.setAttribute('data-sure','1');b.textContent='Confirmar: apagar tudo';setTimeout(function(){b.setAttribute('data-sure','0');b.textContent='Apagar meus dados'},4000);return}
user=null;appts=[];try{localStorage.removeItem('ib_user');localStorage.removeItem('ib_appts_v2')}catch(x){}
$('#fCad').reset();b.setAttribute('data-sure','0');b.textContent='Apagar meus dados';$('#cOla').textContent='Dados apagados.';$('#cMsg').textContent='';rHome();rBan()};

/* Início e lembretes */
function rHome(){var n=active()[0];
if(!n){$('#nxEsp').textContent='Nenhuma consulta agendada';$('#nxWhen').textContent='Agende em poucos passos.';$('#nxPills').innerHTML='';return}
$('#nxEsp').textContent=n.esp;$('#nxWhen').textContent=cap(fmtD(n.data))+' às '+n.hora+' · '+(unit(n.un)||{nome:''}).nome;
$('#nxPills').innerHTML=(n.tr&&n.tr.st==='Solicitado'?'<span class="pill">Transporte solicitado</span>':'')+'<span class="pill">Lembrete ativo</span>'}
function rBan(){var n=active()[0],txt='';
if(n&&when(n)-new Date()<=172800000)txt='Lembrete: consulta de '+n.esp+' em '+fmtD(n.data)+' às '+n.hora+'.'+(n.tr&&n.tr.st==='Solicitado'?' O transporte busca você às '+n.tr.busca+'.':'');
['#banIn','#banCo'].forEach(function(s){var el=$(s);el.textContent=txt;el.hidden=!txt})}
function check(){var now=new Date(),ch=false;
appts.forEach(function(a){if(a.st==='Cancelada')return;var ms=when(a)-now;if(ms<=0)return;
if(ms<=3600000&&!a.r1){a.r1=a.r24=true;ch=true;notify('Sua consulta de '+a.esp+' é daqui a menos de 1 hora, às '+a.hora+'.')}
else if(ms<=86400000&&!a.r24){a.r24=true;ch=true;notify('Lembrete: consulta de '+a.esp+' em '+fmtD(a.data)+' às '+a.hora+'.')}});
if(ch)sv('ib_appts_v2',appts);rBan()}
function nst(){var el=$('#notifSt');if(!('Notification' in window)){el.textContent='Seu navegador não permite notificações; os lembretes aparecem aqui no site.';return}
el.textContent=Notification.permission==='granted'?'Notificações ativadas (valem enquanto o site estiver aberto).':Notification.permission==='denied'?'Notificações bloqueadas no navegador.':'Notificações desativadas.'}
$('#btnNotif').onclick=function(){try{Notification.requestPermission().then(nst)}catch(e){nst()}};

/* Acessibilidade */
function applyPrefs(){document.body.style.zoom=[1,1.15,1.3][prefs.z||0];var d=!!prefs.dark,b=$('#tCont');document.documentElement.setAttribute('data-theme',d?'dark':'light');b.setAttribute('aria-pressed',String(d));b.textContent=d?'Modo claro':'Modo escuro';$('#tAlert').setAttribute('aria-pressed',String(!!prefs.alert));sv('ib_prefs',prefs)}
$('#tMais').onclick=function(){prefs.z=Math.min(2,prefs.z+1);applyPrefs()};
$('#tMenos').onclick=function(){prefs.z=Math.max(0,prefs.z-1);applyPrefs()};
$('#tAlert').onclick=function(){prefs.alert=!prefs.alert;applyPrefs();if(prefs.alert){say('Alerta visual ativado: os lembretes vão piscar a tela e vibrar o celular.');flash()}};
$('#tCont').onclick=function(){prefs.dark=!prefs.dark;applyPrefs()};
$('#tVoz').onclick=function(){var ss=window.speechSynthesis,b=$('#tVoz');
if(!ss){say('Seu navegador não tem leitura em voz alta.');return}
if(ss.speaking){ss.cancel();b.setAttribute('aria-pressed','false');return}
var u=new SpeechSynthesisUtterance($('#main').innerText);u.lang='pt-BR';u.onend=function(){b.setAttribute('aria-pressed','false')};b.setAttribute('aria-pressed','true');ss.speak(u)};

/* Abas */
function reveal(){var els=document.querySelectorAll('[data-page]:not([hidden]) .c,[data-page]:not([hidden]) .d');
if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
els.forEach(function(el,i){if(el.classList.contains('reveal'))return;el.classList.add('reveal');el.style.transitionDelay=(i%4)*70+'ms';io.observe(el)})}
function show(){
var h=(location.hash||'').slice(1);if(pages.indexOf(h)<0)h='inicio';
var s=$$('[data-page]');for(var i=0;i<s.length;i++)s[i].hidden=s[i].getAttribute('data-page')!==h;
var a=$$('nav a');for(var j=0;j<a.length;j++){if(a[j].getAttribute('href')==='#'+h)a[j].setAttribute('aria-current','page');else a[j].removeAttribute('aria-current')}
document.title=(h==='inicio'?'':names[h]+' · ')+'IncluiBem';
if(h!=='agendar'&&editId){editId=null;$('#fAg').reset();agUI()}
if(h==='agendar'){if(editId)prefill();else{rAg();agUI();if(hear())$('#aLib').checked=true;if(preUn){$('#aUn').value=preUn;preUn=null;rAg()}}}
if(h==='unidades')rUn();if(h==='consultas')rCons();if(h==='cadastro')rCad();
rHome();rBan();reveal();window.scrollTo(0,0);
if(!first)$('#main').focus({preventScroll:true});first=false}
var all={};UNITS.forEach(function(u){u.esp.forEach(function(e){all[e]=1})});
$('#fEsp').innerHTML='<option value="">Todas</option>'+Object.keys(all).sort().map(function(e){return '<option>'+esc(e)+'</option>'}).join('');
$('#fEsp').onchange=rUn;$('#fTipo').onchange=rUn;
applyPrefs();window.addEventListener('hashchange',show);show();check();setInterval(check,30000);
})();

// ── Toggles retráteis: Acessibilidade e Sobre o Projeto ──
(function(){
  var aBtn = document.getElementById('a11yToggle');
  var aPan = document.getElementById('a11yPanel');
  var sBtn = document.getElementById('subToggle');
  var sPan = document.getElementById('subPanel');

  function posPanel(){
    var hdr = document.querySelector('header');
    if(hdr && aPan) aPan.style.top = hdr.getBoundingClientRect().bottom + 'px';
  }
  function posSub(){
    var hdr = document.querySelector('header');
    if(!hdr || !sPan) return;
    sPan.style.top = hdr.getBoundingClientRect().bottom + 'px';
    if(sBtn){
      var r = sBtn.getBoundingClientRect();
      sPan.style.right = Math.max(16, window.innerWidth - r.right) + 'px';
    }
  }
  if(aPan){ posPanel(); window.addEventListener('resize', posPanel); }
  if(sPan){ posSub(); window.addEventListener('resize', posSub); }

  if(aBtn && aPan){
    aBtn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = aPan.hasAttribute('hidden');
      aPan[open ? 'removeAttribute' : 'setAttribute']('hidden', '');
      aBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(open){ posPanel(); if(sPan){ sPan.setAttribute('hidden',''); sBtn.setAttribute('aria-expanded','false'); } }
    });
  }
  if(sBtn && sPan){
    sBtn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = sPan.hasAttribute('hidden');
      sPan[open ? 'removeAttribute' : 'setAttribute']('hidden', '');
      sBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(open){ posSub(); if(aPan){ aPan.setAttribute('hidden',''); aBtn.setAttribute('aria-expanded','false'); } }
    });
  }
  document.addEventListener('click', function(e){
    if(aPan && !aPan.hasAttribute('hidden') && aBtn && !aBtn.contains(e.target) && !aPan.contains(e.target)){
      aPan.setAttribute('hidden',''); aBtn.setAttribute('aria-expanded','false');
    }
    if(sPan && !sPan.hasAttribute('hidden') && sBtn && !sBtn.contains(e.target) && !sPan.contains(e.target)){
      sPan.setAttribute('hidden',''); sBtn.setAttribute('aria-expanded','false');
    }
  });
})();
