export type ModerationResult={masked:string;risk:number;reasons:string[];blocked:boolean};
const WORDS=["amk","aq","orospu","piç","sik","yarrak","gavat","ibne","salak","aptal","gerizekalı"];
export function moderateText(input:string):ModerationResult{
 let masked=input;const reasons:string[]=[];let risk=0;
 for(const word of WORDS){const rx=new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"giu");if(rx.test(masked)){masked=masked.replace(rx,"*******");risk+=35;reasons.push("küfür/hakaret")}}
 const links=(input.match(/https?:\/\//gi)||[]).length;if(links>2){risk+=35;reasons.push("yoğun bağlantı")}
 if(/(.)\1{7,}/u.test(input)){risk+=25;reasons.push("flood/tekrar")}
 if(input.length>1200){risk+=20;reasons.push("aşırı uzun mesaj")}
 return{masked,risk:Math.min(risk,100),reasons:[...new Set(reasons)],blocked:risk>=70};
}
