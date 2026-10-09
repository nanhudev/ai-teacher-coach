const PptxGenJS=require('pptxgenjs');
async function writeLessonPpt(lesson,file){
 const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='AI Teacher Coach';pptx.subject='请教师复核后使用';
 const pages=[{title:lesson.title,text:lesson.objectives.join('\n')},...lesson.stages.map(s=>({title:`${s.title} · ${s.minutes}分钟`,text:`${s.activity}\n\n关键问题：${s.question}`})),{title:'原文与复核',text:[...lesson.sourceQuotes,...lesson.reviewNotes].join('\n')}];
 for(const p of pages){const slide=pptx.addSlide();slide.background={color:'F3F5F1'};slide.addText(p.title,{x:.7,y:.5,w:12,h:1,fontSize:28,color:'164C3B',bold:true,fontFace:'Microsoft YaHei'});slide.addText(p.text,{x:.7,y:1.8,w:11.8,h:4.8,fontSize:19,color:'243B32',fit:'shrink',fontFace:'Microsoft YaHei'});}
 await pptx.writeFile({fileName:file});return file;
}
module.exports={writeLessonPpt};
