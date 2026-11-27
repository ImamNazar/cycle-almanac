const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const read=n=>fs.readFileSync("assets/js/"+n+".js","utf8");
const A=require("../assets/js/engine.js");
const w={Almanac:A};vm.runInNewContext(read("content"),{self:w});
const source=read("reimagined"),end=source.lastIndexOf("window.__almanac=");
assert.ok(end>0);
const app=vm.runInNewContext(source.slice(0,end)+`return {pages:[todayPage,calendarPage,logPage,insightsPage,discoverPage],sample(){data.logs=A.makeSample(today)},mode(m){data.settings.mode=m}};})();`,{window:w,document:{addEventListener(){},querySelector(){return {addEventListener(){}}}},localStorage:{getItem(){return null}}});
let count=0;
for(const sample of [false,true]){if(sample)app.sample();for(const mode of ["natural","paused","hormonal"]){app.mode(mode);for(const page of app.pages){assert.ok(page().length>0,mode+" "+page.name);count++;}}}
console.log(count+" page-rendering scenarios passed");
