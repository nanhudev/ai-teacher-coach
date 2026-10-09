const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const JSZip=require('jszip');const {writeLessonPpt}=require('../lesson-ppt.cjs');
test('Editable PPTX includes lesson activities, timing, and review notes',async()=>{
 const file=path.resolve(__dirname,'../../docs/assets/lesson-example.pptx');fs.mkdirSync(path.dirname(file),{recursive:true});
 await writeLessonPpt({title:'《师说》样例课件',objectives:['寻找论点与证据'],stages:[{title:'研读',minutes:40,activity:'小组逐句研读，并核对教材原文。',question:'作者如何支持自己的判断？'}],sourceQuotes:[],reviewNotes:['固定测试样例，未经 AI 生成；请教师复核。']},file);
 const zip=await JSZip.loadAsync(fs.readFileSync(file));const slides=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));assert.equal(slides.length,3);
 const text=(await Promise.all(slides.map(n=>zip.file(n).async('string')))).join('');assert(text.includes('40分钟'));assert(text.includes('小组逐句研读'));assert(text.includes('未经 AI 生成'));assert(zip.file('ppt/presentation.xml'));
});
