/* Atlas V4.1 UX enhancements — original native JavaScript, no React dependency.
   Inspired by interaction patterns from https://reactbits.dev. */
(function(){
'use strict';
if(window.AtlasUX41)return;
const q=id=>document.getElementById(id);
const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const fine=()=>!!window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer=null,activeToast=null;
const justAdded=new Set();
const toastRegion=document.createElement('div');
toastRegion.className='ux-toast-region';toastRegion.id='uxToastRegion';
toastRegion.setAttribute('aria-live','polite');toastRegion.setAttribute('aria-atomic','true');document.body.append(toastRegion);
function closeToast(){if(toastTimer)clearTimeout(toastTimer);toastTimer=null;activeToast?.remove();activeToast=null}
function showToast(message,opts={}){
  if(!message)return;
  closeToast();
  const kind=opts.kind||'success',duration=opts.duration===undefined?5600:opts.duration;
  const el=document.createElement('article');
  el.className='ux-toast';el.dataset.kind=kind;
  el.setAttribute('role',kind==='error'?'alert':'status');
  const icon=document.createElement('span');icon.className='ux-toast-icon';icon.setAttribute('aria-hidden','true');icon.textContent=kind==='success'?'✓':kind==='info'?'i':'!';
  const content=document.createElement('div');content.className='ux-toast-text';
  const title=document.createElement('span');title.textContent=message;content.append(title);
  if(opts.detail){const sub=document.createElement('span');sub.className='ux-toast-detail';sub.textContent=opts.detail;content.append(sub)}
  const tools=document.createElement('div');tools.className='ux-toast-tools';
  if(opts.action&&typeof opts.onAction==='function'){
    const action=document.createElement('button');action.type='button';action.textContent=opts.action;
    action.addEventListener('click',()=>{const cb=opts.onAction;closeToast();cb()});tools.append(action);
  }
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='ux-dismiss';dismiss.setAttribute('aria-label','Dispensar aviso');dismiss.textContent='×';dismiss.addEventListener('click',closeToast);tools.append(dismiss);
  el.append(icon,content,tools);
  if(duration>0){const progress=document.createElement('span');progress.className='ux-toast-time';progress.setAttribute('aria-hidden','true');el.append(progress)}
  toastRegion.append(el);activeToast=el;
  let remaining=duration,started=0;
  const pause=()=>{if(toastTimer){remaining=Math.max(0,remaining-(Date.now()-started));clearTimeout(toastTimer);toastTimer=null}};
  const resume=()=>{if(duration>0&&remaining>0){started=Date.now();toastTimer=setTimeout(closeToast,remaining)}};
  el.addEventListener('mouseenter',pause);el.addEventListener('mouseleave',resume);
  el.addEventListener('focusin',pause);el.addEventListener('focusout',e=>{if(!el.contains(e.relatedTarget))resume()});
  resume();
}
function kindOf(s){return /erro|falha|indispon|inválid|não foi possível|não gerad/i.test(s)?'error':/cancelad|atenção|permita|extensa|mantenha/i.test(s)?'warning':/preparando|carregando|gerando|baixando|salvando/i.test(s)?'info':'success'}
const notice=q('notice');
if(notice){
  notice.setAttribute('aria-live','off');
  new MutationObserver(()=>{
    let message=notice.textContent.trim();if(!message)return;
    if(message==='PDF visual pronto para compartilhar.')message='PDF preparado. Confira o download ou compartilhamento.';
    const kind=kindOf(message);showToast(message,{kind,duration:kind==='error'?0:5400});
  }).observe(notice,{subtree:true,characterData:true,childList:true});
}
function flash(el){if(!el||reduced())return;el.classList.remove('ux-action-highlight');void el.offsetWidth;el.classList.add('ux-action-highlight')}
function decorateDayButtons(id,attribute){
  const parent=q(id);if(!parent)return;parent.classList.add('ux-segment');
  parent.querySelectorAll('button').forEach(b=>{
    const i=Number(b.dataset[attribute]),session=active?.days?.[i],selected=i===dayIndex;
    b.setAttribute('aria-pressed',String(selected));
    if(session)b.setAttribute('aria-label',(selected?'Sessão atual: ':'Selecionar sessão: ')+session.name);
  });
}
const previousSwitchTab=switchTab;
switchTab=function(next){
  previousSwitchTab(next);
  document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
};
const previousUpdateCart=updateCart;
updateCart=function(){
  const node=q('cartCount'),old=node?.textContent;
  previousUpdateCart();
  if(node){
    node.setAttribute('aria-label',node.textContent+' exercícios na montagem');
    if(old!==node.textContent&&!reduced()){
      node.classList.remove('ux-pulse');void node.offsetWidth;node.classList.add('ux-pulse');
    }
  }
};
const previousPickDays=renderPickDays;
renderPickDays=function(){
  previousPickDays();decorateDayButtons('pickDays','pickday');
  const holder=q('pickDays')?.parentElement;if(!holder)return;
  let descriptor=holder.querySelector('.ux-active-session');
  if(!descriptor){descriptor=document.createElement('p');descriptor.className='ux-active-session';holder.append(descriptor)}
  descriptor.innerHTML='Destino selecionado: <strong>'+escapeHTML(active?.days?.[dayIndex]?.name||'Treino')+'</strong>';
};
const previousEditor=renderEditor;
renderEditor=function(){previousEditor();decorateDayButtons('days','day')};
const previousCard=card;
card=function(ex,add){
  const el=previousCard(ex,add),preview=el.querySelector('.exercise-preview-trigger');
  preview?.setAttribute('title','Ver movimento em duas posições');
  if(!add)return el;
  const btn=el.querySelector('[data-add]');if(!btn)return el;
  const hint=document.createElement('p');hint.className='ux-card-context';
  hint.textContent='Adicionar à sessão '+(active?.days?.[dayIndex]?.name||'A');
  btn.insertAdjacentElement('beforebegin',hint);
  let busy=false,timer=null;
  btn.onclick=()=>{
    if(busy)return;
    const plan=active||(active=fresh()),day=plan.days[dayIndex];
    if(!day){showToast('Selecione uma sessão.',{kind:'warning'});return}
    busy=true;
    const item={id:uid(),exerciseId:ex.id,name:title(ex),image:image(ex),muscle:muscle(ex),sets:3,reps:'8–12',rest:'',notes:''};
    day.items.push(item);justAdded.add(item.id);updateCart();
    el.classList.add('is-added');btn.dataset.confirmed='true';
    btn.textContent='✓ Adicionado ao treino '+day.name;hint.textContent='Incluído na sessão '+day.name;
    const reset=()=>{
      busy=false;btn.disabled=false;delete btn.dataset.confirmed;
      if(!btn.isConnected)return;
      btn.textContent='+ Adicionar';hint.textContent='Adicionar à sessão '+(active?.days?.[dayIndex]?.name||'Treino');el.classList.remove('is-added');
    };
    clearTimeout(timer);btn.disabled=true;timer=setTimeout(reset,900);
    showToast(item.name+' adicionado ao treino '+day.name,{
      detail:'Continue selecionando ou desfaça esta inclusão.',action:'Desfazer',duration:7000,
      onAction:()=>{
        const i=day.items.findIndex(x=>x.id===item.id);
        if(i<0)return;
        day.items.splice(i,1);justAdded.delete(item.id);updateCart();reset();
        if(active&&q('editor')&&!q('editor').classList.contains('hidden'))renderChosen();
        showToast('Adição desfeita.',{kind:'info'});
      }
    });
  };
  return el;
};
const previousRenderLibrary=renderLibrary;
renderLibrary=function(reset=false){
  previousRenderLibrary(reset);
  const grid=q('libraryGrid'),status=q('libraryStatus');
  if(!grid||!status)return;
  let empty=q('uxCatalogEmpty');
  if(!empty){empty=document.createElement('div');empty.id='uxCatalogEmpty';empty.className='ux-catalog-empty hidden';grid.insertAdjacentElement('afterend',empty)}
  const term=q('librarySearch').value.trim(),muscleName=q('libraryMuscle').value,total=Number.parseInt(status.textContent,10)||0;
  const loading=!catalog.length&&!/indisponível|não foi possível/i.test(status.textContent);
  const show=!loading&&total===0;
  empty.classList.toggle('hidden',!show);
  if(show)empty.innerHTML=term||muscleName?'<h3>Nenhum exercício encontrado</h3><p>Tente outro termo ou altere o filtro de musculatura.</p>':'<h3>Biblioteca sem exercícios</h3><p>Verifique sua conexão e atualize a página.</p>';
  status.setAttribute('aria-live','polite');
  if(loading&&!status.textContent.trim())status.textContent='Carregando biblioteca de exercícios…';
  q('libraryMore')?.setAttribute('aria-label','Carregar mais exercícios');
  grid.querySelectorAll('.card').forEach(el=>{
    const add=el.querySelector('[data-add]'),name=el.querySelector('b')?.textContent||'exercício';
    if(add)add.setAttribute('aria-label','Adicionar '+name+' à sessão '+(active?.days?.[dayIndex]?.name||'Treino'));
  });
};
const previousSaved=renderSaved;
renderSaved=function(){
  previousSaved();
  [...q('saved').querySelectorAll('.plan-card')].forEach((el,index)=>{
    const plan=plans[index];if(!plan)return;
    el.classList.add('ux-spotlight');
    if(fine()&&!reduced())el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect();
      el.style.setProperty('--ux-x',(e.clientX-r.left)+'px');el.style.setProperty('--ux-y',(e.clientY-r.top)+'px');
    },{passive:true});
    const labels={open:'Abrir ficha ',duplicate:'Duplicar ficha ',export:'Exportar JSON da ficha ',delete:'Excluir ficha '};
    Object.keys(labels).forEach(key=>el.querySelector('[data-action="'+key+'"]')?.setAttribute('aria-label',labels[key]+plan.name));
    el.addEventListener('click',e=>{
      const action=e.target.closest('[data-action]')?.dataset.action;
      if(action!=='duplicate'&&action!=='delete')return;
      e.preventDefault();e.stopPropagation();
      if(action==='duplicate'){
        const copy=structuredClone(plan);copy.id=uid();copy.name+=' (cópia)';
        plans.unshift(copy);if(!persist()){plans=plans.filter(x=>x.id!==copy.id);return}
        renderSaved();const first=q('saved').querySelector('.plan-card');
        if(first){flash(first);first.querySelector('[data-action="open"]')?.focus({preventScroll:true})}
        showToast('Ficha duplicada: '+copy.name);
      }
      if(action==='delete'){
        const i=plans.findIndex(x=>x.id===plan.id);if(i<0)return;
        const removed=plans.splice(i,1)[0];
        if(!persist()){plans.splice(i,0,removed);return}
        renderSaved();
        showToast('Ficha excluída: '+removed.name,{
          kind:'warning',action:'Desfazer',duration:10000,
          onAction:()=>{
            if(plans.some(p=>p.id===removed.id))return;
            plans.splice(Math.min(i,plans.length),0,removed);
            if(!persist()){plans=plans.filter(p=>p.id!==removed.id);return}
            renderSaved();showToast('Ficha restaurada: '+removed.name);
          }
        });
      }
    },true);
  });
};
renderChosen=function(before=null,focusId=null,focusMove=null){
  if(!active?.days?.[dayIndex])return;
  const container=q('chosen'),day=active.days[dayIndex],items=day.items;
  container.innerHTML=items.length?'':'<div class="empty">Nenhum exercício nesta sessão. Use “Escolher exercícios” para começar.</div>';
  items.forEach((it,i)=>{
    const row=document.createElement('div');row.className='exercise';row.dataset.uxItemId=it.id;
    row.innerHTML='<button type="button" class="exercise-preview-trigger chosen-preview" aria-label="Ver movimento de '+escapeHTML(it.name)+'" title="Ver demonstração"><img loading="lazy" alt="" src="'+escapeHTML(it.image)+'"><span class="preview-label" aria-hidden="true">▶</span></button>'+
      '<div class="details"><strong>'+escapeHTML(it.name)+'</strong><small>'+escapeHTML(it.muscle||'Exercício')+'</small><div class="row" style="margin-top:8px">'+
      '<label>Séries<br><input type="number" min="1" max="30" data-field="sets" value="'+escapeHTML(it.sets)+'"></label>'+
      '<label>Reps<br><input data-field="reps" value="'+escapeHTML(it.reps)+'"></label>'+
      '<label>Descanso<br><input placeholder="90s" data-field="rest" value="'+escapeHTML(it.rest)+'"></label></div>'+
      '<input data-field="notes" aria-label="Observações de '+escapeHTML(it.name)+'" placeholder="Observações (opcional)" value="'+escapeHTML(it.notes)+'">'+
      '<div class="row" style="margin-top:7px">'+
      '<button class="ux-tip" type="button" data-move="-1" data-ux-tip="Mover para cima" aria-label="Mover '+escapeHTML(it.name)+' para cima">↑</button>'+
      '<button class="ux-tip" type="button" data-move="1" data-ux-tip="Mover para baixo" aria-label="Mover '+escapeHTML(it.name)+' para baixo">↓</button>'+
      '<button class="danger" type="button" data-remove aria-label="Remover '+escapeHTML(it.name)+' desta sessão">Remover</button></div></div>';
    const preview=row.querySelector('.exercise-preview-trigger');
    preview.onclick=()=>openMotion(it.name,motionFramesFromSaved(it),preview);
    preview.querySelector('img').onerror=e=>{e.target.style.visibility='hidden'};
    row.querySelectorAll('[data-field]').forEach(input=>{
      const sync=()=>{it[input.dataset.field]=input.dataset.field==='sets'?Math.max(1,Number(input.value)||1):input.value};
      input.addEventListener('input',sync);input.addEventListener('change',sync);
    });
    row.querySelector('[data-remove]').onclick=()=>{
      const position=day.items.findIndex(x=>x.id===it.id);if(position<0)return;
      const removed=day.items.splice(position,1)[0];renderChosen();updateCart();
      showToast('Exercício removido: '+removed.name,{
        kind:'warning',detail:'Sessão '+day.name,action:'Desfazer',duration:10000,
        onAction:()=>{
          if(!active||!active.days.includes(day)||day.items.some(x=>x.id===removed.id)){showToast('Montagem alterada: não foi possível restaurar.',{kind:'warning'});return}
          day.items.splice(Math.min(position,day.items.length),0,removed);
          if(active.days[dayIndex]===day)renderChosen();
          updateCart();showToast('Exercício restaurado na posição original.');
        }
      });
    };
    row.querySelectorAll('[data-move]').forEach(button=>{
      const amount=Number(button.dataset.move);button.disabled=(i+amount<0||i+amount>=items.length);
      button.onclick=()=>{
        const pos=day.items.findIndex(x=>x.id===it.id),dest=pos+amount;
        if(pos<0||dest<0||dest>=day.items.length)return;
        const rects=new Map([...container.querySelectorAll('[data-ux-item-id]')].map(el=>[el.dataset.uxItemId,el.getBoundingClientRect()]));
        [day.items[pos],day.items[dest]]=[day.items[dest],day.items[pos]];
        renderChosen(rects,it.id,String(amount));
      };
    });
    container.append(row);
    if(justAdded.delete(it.id)&&!reduced())row.classList.add('ux-entry');
  });
  if(before&&!reduced())requestAnimationFrame(()=>{
    container.querySelectorAll('[data-ux-item-id]').forEach(row=>{
      const prev=before.get(row.dataset.uxItemId);if(!prev)return;
      const dy=prev.top-row.getBoundingClientRect().top;
      if(Math.abs(dy)>2)row.animate([{transform:'translateY('+dy+'px)'},{transform:'translateY(0)'}],{duration:230,easing:'cubic-bezier(.22,1,.36,1)'});
    });
  });
  if(focusId){
    const row=[...container.querySelectorAll('[data-ux-item-id]')].find(el=>el.dataset.uxItemId===focusId);
    row?.querySelector('[data-move="'+focusMove+'"]')?.focus({preventScroll:true});
  }
};
const previousOpenMotion=openMotion;
const viewer=q('motionViewer'),motionPanel=viewer?.querySelector('.motion-panel');
let motionInfo=null,lastArgs=null;
if(motionPanel){
  motionInfo=document.createElement('div');motionInfo.className='ux-motion-info';motionInfo.id='uxMotionInfo';
  motionPanel.insertBefore(motionInfo,motionPanel.querySelector('.motion-media'));
}
const retry=document.createElement('button');retry.type='button';retry.id='uxMotionRetry';
retry.className='ux-motion-retry hidden';retry.textContent='Tentar carregar novamente';
q('motionStatus')?.parentElement?.insertAdjacentElement('afterend',retry);
retry.addEventListener('click',()=>{if(lastArgs)openMotion(...lastArgs)});
openMotion=async function(name,frames,trigger){
  lastArgs=[name,frames,trigger];
  const ex=catalog.find(x=>title(x)===name||x.name===name);
  const saved=active?.days?.flatMap(d=>d.items).find(x=>x.name===name);
  const details=[ex?muscle(ex):saved?.muscle,ex?.equipment].filter(Boolean);
  if(motionInfo)motionInfo.replaceChildren(...details.map(value=>{
    const chip=document.createElement('span');chip.className='ux-motion-chip';chip.textContent=value;return chip;
  }));
  retry.classList.add('hidden');q('motionStatus')?.setAttribute('data-state','loading');
  try{await previousOpenMotion(name,frames,trigger)}
  finally{
    q('motionStatus')?.setAttribute('data-state',motionSources.length?'ready':'error');
    if(!viewer.classList.contains('hidden')&&!motionSources.length)retry.classList.remove('hidden');
  }
};
const previousCloseMotion=closeMotion;
closeMotion=function(){previousCloseMotion();retry.classList.add('hidden');lastArgs=null};
for(const id of ['jpg','pdf']){
  const button=q(id),previous=button?.onclick;if(!button||typeof previous!=='function')continue;
  const label=button.textContent;let processing=false;
  button.onclick=async()=>{
    if(processing)return;processing=true;
    button.dataset.uxProcessing='true';button.setAttribute('aria-busy','true');
    button.textContent=id==='jpg'?'Preparando imagens':'Preparando PDF';
    let status=q('uxExportStatus');
    if(!status){
      status=document.createElement('p');status.id='uxExportStatus';status.className='ux-export-status';
      button.parentElement?.insertAdjacentElement('afterend',status);
    }
    status.textContent='Preparando o conteúdo para exportação…';
    try{await previous();status.textContent='Confira o download ou compartilhamento no dispositivo.'}
    catch(e){status.textContent='Falha na exportação. Tente novamente.';showToast('Falha na exportação: '+e.message,{kind:'error',duration:0})}
    finally{button.textContent=label;button.removeAttribute('aria-busy');delete button.dataset.uxProcessing;button.disabled=false;processing=false}
  };
}
const save=q('save'),oldSave=save?.onclick;
if(save&&typeof oldSave==='function'){
  save.onclick=()=>{save.setAttribute('aria-busy','true');try{oldSave()}finally{save.removeAttribute('aria-busy')}};
}
document.querySelectorAll('[data-tab]').forEach(btn=>btn.type='button');
switchTab(tab);
window.AtlasUX41={version:'4.1',showToast,closeToast,features:{undo:true,sessionSelector:true,feedback:true,motionRetry:true,exportStatus:true}};
})();