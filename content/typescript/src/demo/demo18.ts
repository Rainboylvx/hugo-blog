
interface Waiter {
    anjao:boolean;
    say:()=>{};

}
interface Teacher {
    anjao:boolean;
    skill: ()=>{};
}

function judgeWho ( person : Waiter | Teacher){
    if(person.anjao){
        (person as Teacher).skill()
    }
    else{
        (person as Waiter).say()
    }
    //person.say();
}
function judgeWho2 ( person : Waiter | Teacher){
    if('skill' in person){
        person.skill()
    }
    else{
        person.say()
    }
    //person.say();
}

function add( first: string | number , second : string | number){
    if( typeof first === "string" || typeof second === "string")
        return `${first} ${second}`
    return first + second;
}

class NumberObj{
    count : number;
}

function addObj(first : Object | NumberObj,second: Object | NumberObj  ){
    if( first instanceof NumberObj && second instanceof NumberObj ){
        return first.count + second.count;
    }
    return 0;
}
