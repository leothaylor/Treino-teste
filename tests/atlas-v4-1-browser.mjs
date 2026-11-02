// Atlas V4.1 cross-viewport UX smoke tests (Chromium).
// The browser mocks only external exercise images/data and Web Share on mobile.
// Fichas come from tests/fixtures; no personal user data is read.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=JSON.parse(await fs.readFile(path.join(root,'tests/fixtures/atlas-v4-1-fixtures.json'),'utf8'));
const catalog=[
 {id:'barbell-press',name:'Barbell Bench Press - Medium Grip',primaryMuscles:['chest'],equipment:'Barbell',images:['press/0.jpg','press/1.jpg']},
 {id:'barbell-curl',name:'Barbell Curl',primaryMuscles:['biceps'],equipment:'Barbell',images:['curl/0.jpg','curl/1.jpg']},
 {id:'barbell-squat',name:'Squat',primaryMuscles:['quadriceps'],equipment:'Barbell',images:['squat/0.jpg','squat/1.jpg']}
];
const tinyPNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGM88GwLAwMDEwMDAwMDAwMDAwAcbgJel6l5DAAAAABJRU5ErkJggg==','base64');
const types={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+pathname);
  if(!target.startsWith(root)){res.writeHead(403);res.end();return}
  const data=await fs.readFile(pathname==='/'?path.join(root,'index.html'):target);
  res.writeHead(200,{'content-type':pathname==='/'?'text/html;charset=utf-8':types[path.extname(target)]||'text/plain'});res.end(data);
 }catch{res.writeHead(404);res.end('not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
const errors=[];
const runlog=[];
const output=path.join(root,'test-results');
await fs.mkdir(output,{recursive:true});
let context=null;
async function setup({mobile=false,reduced=false,planFixture=fixtures[0],share=true,width=1280}={}){
 if(context)await context.close();
 context=await browser.newContext({
   viewport:{width,height:850},deviceScaleFactor:1,
   userAgent:mobile?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0',
   isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference',acceptDownloads:true
 });
 await context.addInitScript(({fixture,mobile,share})=>{
   localStorage.setItem('construtor-treino-v2-plans',JSON.stringify([fixture]));
   window.__sharedFiles=[];
   if(mobile){
     Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>share});
     Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{
       window.__sharedFiles.push(payload.files.map(f=>f.name));
     }});
   }
   // PDF generator API is mocked to avoid fetching a third-party script.
   window.jspdf={jsPDF:class{
     constructor(){this.pages=1}
     addPage(){this.pages++}
     addImage(){}
     output(){return new Blob(['%PDF-1.4\n% smoke test PDF'],{type:'application/pdf'})}
   }};
 },{fixture:planFixture,mobile,share});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push('pageerror: '+error.message));
 await page.route('https://raw.githubusercontent.com/**',route=>{
   if(route.request().url().includes('exercises.json'))route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(catalog)});
   else route.fulfill({status:200,contentType:'image/png',body:tinyPNG});
 });
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(900);
 const diagnostic=await page.evaluate(()=>({ux:!!window.AtlasUX41,plans:document.querySelectorAll('.plan-card').length,scripts:[...document.scripts].map(x=>x.src||'[inline]'),notice:document.getElementById('notice')?.textContent,body:document.body.innerText.slice(0,180)}));
 console.log('DIAGNOSTIC',JSON.stringify(diagnostic),'errors',errors.slice(-3));
 await page.waitForFunction(()=>!!window.AtlasUX41&&document.querySelectorAll('.plan-card').length===1,{timeout:12000});
 await page.waitForFunction(()=>document.getElementById('libraryStatus').textContent.includes('exercícios'));
 assert.equal(await page.evaluate(()=>window.AtlasUX41.version),'4.1');
 return page;
}
async function waitForCount(list,n){
 for(let i=0;i<120;i++){
   if(list.length>=n)return;
   await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw Error('Expected '+n+' downloads; saw '+list.length);
}
function pass(name){runlog.push('PASS '+name);console.log('PASS',name)}
try{
 let page=await setup();
 assert.equal(await page.locator('.plan-card').count(),1);
 assert.equal((await page.locator('#statSessions').textContent()).trim(),'3');
 pass('V4 baseline fixtures, stats and UX script loaded');
 await page.locator('.plan-card [data-action=open]').click();
 await page.locator('[data-tab=biblioteca]').click();
 await page.locator('#pickDays [data-pickday="1"]').click();
 assert.match(await page.locator('.ux-active-session').innerText(),/B/);
 await page.locator('#librarySearch').fill('Rosca');
 await page.waitForTimeout(100);
 assert.equal(await page.locator('#libraryGrid .card').count(),1);
 const card=page.locator('#libraryGrid .card').first();
 await card.locator('[data-add]').click();
 assert.match(await card.locator('.ux-card-context').innerText(),/Incluído na sessão B/);
 assert.equal((await page.locator('#cartCount').innerText()).trim(),'4');
 await page.locator('.ux-toast-tools button').filter({hasText:'Desfazer'}).click();
 assert.equal((await page.locator('#cartCount').innerText()).trim(),'3');
 pass('catalog filter, destination context, add feedback, undo without duplicate');
 await page.waitForTimeout(1000);
 await card.locator('[data-add]').click();
 await page.waitForTimeout(1000);
 await card.locator('[data-add]').click();
 assert.equal((await page.locator('#cartCount').innerText()).trim(),'5');
 pass('intentional repeated additions remain supported');
 await page.locator('[data-tab=editor]').click();
 assert.equal(await page.locator('#chosen .exercise').count(),3);
 const first=page.locator('#chosen .exercise').first();
 await first.locator('[data-field=notes]').fill('Nota persistida durante a troca de ordem');
 await first.locator('[data-move="1"]').click();
 assert.match(await page.locator('#chosen .exercise').nth(1).locator('[data-field=notes]').inputValue(),/Nota persistida/);
 pass('edited notes survive reordering');
 await page.locator('#chosen .exercise').nth(1).locator('[data-remove]').click();
 assert.equal(await page.locator('#chosen .exercise').count(),2);
 await page.locator('.ux-toast-tools button').filter({hasText:'Desfazer'}).click();
 assert.equal(await page.locator('#chosen .exercise').count(),3);
 assert.match(await page.locator('#chosen .exercise').nth(1).locator('[data-field=notes]').inputValue(),/Nota persistida/);
 pass('remove and undo restores position and edited data');
 await page.locator('#save').click();
 assert.equal(await page.locator('.plan-card').count(),1);
 await page.locator('.plan-card [data-action=open]').click();
 await page.locator('#days [data-day="1"]').click();
 assert.equal(await page.locator('#chosen .exercise').count(),3);
 pass('save/reopen persists changes using legacy data schema');
 await page.locator('[data-tab=biblioteca]').click();
 await page.locator('#librarySearch').fill('não existe xzyq');
 assert.equal(await page.locator('#libraryGrid .card').count(),0);
 assert.match(await page.locator('#uxCatalogEmpty').innerText(),/Nenhum exercício/);
 pass('zero-result search empty state');
 await page.locator('#librarySearch').fill('Rosca');
 await page.locator('#libraryGrid .exercise-preview-trigger').first().click();
 await page.waitForFunction(()=>document.getElementById('motionFrameCount').textContent.includes('2'));
 assert.match(await page.locator('#uxMotionInfo').innerText(),/Bíceps/);
 await page.locator('#motionToggle').click();
 assert.equal(await page.locator('#motionToggle').textContent(),'Reproduzir');
 await page.locator('#motionStep').click();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#motionViewer').isVisible(),false);
 assert.equal(await page.locator('#libraryGrid .exercise-preview-trigger').first().evaluate(el=>document.activeElement===el),true,'Modal focus not restored');
 pass('motion preview, metadata, controls and Escape focus lifecycle');
 // Two sessions with mocked photos; three standalone JPG downloads.
 const downloads=[];
 page.on('download',d=>downloads.push(d.suggestedFilename()));
 await page.locator('[data-tab=editor]').click();
 await page.locator('#jpg').click();
 await waitForCount(downloads,3);
 assert(downloads.some(x=>x.endsWith('-treino-A.jpg')));
 assert(downloads.some(x=>x.endsWith('-treino-B.jpg')));
 assert(downloads.some(x=>x.endsWith('-treino-C.jpg')));
 pass('desktop JPG exports separate A/B/C and avoids Web Share');
 await page.locator('#pdf').click();
 await waitForCount(downloads,4);
 assert(downloads.some(x=>x.endsWith('-visual.pdf')));
 pass('PDF export preserved');
 // saved-card duplicate and remove+undo, persisting to localStorage
 await page.locator('[data-tab=fichas]').click();
 await page.locator('.plan-card [data-action=duplicate]').click();
 assert.equal(await page.locator('.plan-card').count(),2);
 await page.locator('.plan-card').first().locator('[data-action=delete]').click();
 assert.equal(await page.locator('.plan-card').count(),1);
 await page.locator('.ux-toast-tools button').filter({hasText:'Desfazer'}).click();
 assert.equal(await page.locator('.plan-card').count(),2);
 pass('duplicate and undo delete of saved plan');
 await page.evaluate(()=>window.AtlasUX41.closeToast());
 for(const width of [360,390,768,1024,1440]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(120);
   await page.screenshot({path:path.join(output,'atlas-v4-1-'+width+'.png'),fullPage:true});
   assert.equal(await page.locator('#uxToastRegion').count(),1);
 }
 pass('five viewport sizes captured and checked');
 // Additional clean screenshots of all three views at desktop and mobile sizes.
 for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});
   await page.locator('.plan-card [data-action=open]').first().click();
   await page.waitForTimeout(350);
   if(width===390){const notes=await page.locator('#chosen .exercise [data-field=notes]').first().boundingBox();assert(notes&&notes.width>=150,'Mobile notes input is too narrow: '+notes?.width)}
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.screenshot({path:path.join(output,'atlas-v4-1-editor-'+width+'.png'),fullPage:true});
   await page.locator('[data-tab=biblioteca]').click();
   await page.waitForTimeout(350);
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.screenshot({path:path.join(output,'atlas-v4-1-catalog-'+width+'.png'),fullPage:true});
   await page.locator('[data-tab=fichas]').click();
 }
 pass('editor and catalog layouts captured in desktop and mobile');
 // Baseline of the validated V4, rendered separately for visual comparison.
 const baseline=execFileSync('git',['show','939e1eeab2d6ade2bf1ab8ead974e81ac88e256d:index.html'],{cwd:root,encoding:'utf8'});
 await fs.writeFile(path.join(output,'atlas-v4-baseline.html'),baseline);
 const baselineContext=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
 await baselineContext.addInitScript(fixture=>localStorage.setItem('construtor-treino-v2-plans',JSON.stringify([fixture])),fixtures[0]);
 const baselinePage=await baselineContext.newPage();
 await baselinePage.route('https://raw.githubusercontent.com/**',route=>{
   if(route.request().url().includes('exercises.json'))route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(catalog)});
   else route.fulfill({status:200,contentType:'image/png',body:tinyPNG});
 });
 await baselinePage.goto(base+'/test-results/atlas-v4-baseline.html',{waitUntil:'domcontentloaded'});
 await baselinePage.waitForSelector('.plan-card');
 for(const width of [390,1440]){
   await baselinePage.setViewportSize({width,height:900});
   await baselinePage.evaluate(()=>window.scrollTo(0,0));
   await baselinePage.screenshot({path:path.join(output,'atlas-v4-baseline-home-'+width+'.png'),fullPage:true});
 }
 await baselineContext.close();
 pass('validated V4 baseline screenshots generated for visual comparison');
 page=await setup({planFixture:fixtures[2],width:1280});
 const longDownloads=[];
 page.on('download',d=>longDownloads.push(d.suggestedFilename()));
 await page.locator('.plan-card [data-action=open]').click();
 await page.locator('#jpg').click();
 await waitForCount(longDownloads,3);
 assert(longDownloads.some(x=>x.includes('parte-1')));
 assert(longDownloads.some(x=>x.includes('parte-3')));
 pass('long sessions exported in multiple independent JPGs');
 page=await setup({mobile:true,share:true,width:390});
 await page.locator('.plan-card [data-action=open]').click();
 await page.locator('#jpg').click();
 await page.waitForFunction(()=>window.__sharedFiles.length>0);
 assert.equal((await page.evaluate(()=>window.__sharedFiles[0])).length,3);
 pass('simulated mobile Web Share with three photos');
 page=await setup({mobile:true,share:false,width:390});
 const zipDownloads=[];
 page.on('download',d=>zipDownloads.push(d.suggestedFilename()));
 await page.locator('.plan-card [data-action=open]').click();
 await page.locator('#jpg').click();
 await waitForCount(zipDownloads,1);
 assert(zipDownloads[0].endsWith('-imagens.zip'));
 pass('simulated mobile ZIP fallback');
 page=await setup({reduced:true});
 await page.locator('[data-tab=biblioteca]').click();
 await page.locator('#libraryGrid .exercise-preview-trigger').first().click();
 await page.waitForFunction(()=>document.getElementById('motionFrameCount').textContent.includes('2'));
 assert.match(await page.locator('#motionStatus').textContent(),/pausado pela preferência/);
 pass('reduced-motion accessibility setting prevents autoplay');
 await page.keyboard.press('Escape');
 page=await setup({width:1280});
 await page.locator('.plan-card [data-action=open]').click();
 const jsonDownloads=[];page.on('download',d=>jsonDownloads.push(d.suggestedFilename()));
 await page.locator('#json').click();
 await waitForCount(jsonDownloads,1);
 assert(jsonDownloads[0].endsWith('.json'));
 await page.locator('[data-tab=fichas]').click();
 await page.locator('#importFile').setInputFiles({
   name:'atlas-fixture-import.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(fixtures[0]),'utf8')
 });
 await page.waitForFunction(()=>document.querySelectorAll('.plan-card').length===2);
 pass('legacy JSON export and import preserved');
 page=await setup({width:390});
 await page.route('**/press/*.jpg',route=>route.abort());
 await page.locator('[data-tab=biblioteca]').click();
 await page.locator('#libraryGrid .card').first().locator('.exercise-preview-trigger').click();
 await page.waitForFunction(()=>!document.getElementById('uxMotionRetry').classList.contains('hidden'),undefined,{timeout:12000});
 assert.match(await page.locator('#motionStatus').textContent(),/indisponíveis/);
 await page.unroute('**/press/*.jpg');
 await page.locator('#uxMotionRetry').click();
 await page.waitForFunction(()=>document.getElementById('motionFrameCount').textContent.includes('2'),undefined,{timeout:12000});
 await page.keyboard.press('Escape');
 pass('motion image network failure shows retry and can recover');
 assert.equal(errors.length,0,'Browser exceptions: '+errors.join('\n'));
 pass('no uncaught browser exceptions');
 console.log('\nSUMMARY:',runlog.length,'checks passed; screenshots in',output);
}finally{
 await context?.close();await browser.close();await new Promise(resolve=>server.close(resolve));
}
