//const screenResume = (name:string ,age:number,bust:number) =>{
    //age < 24 && bust >= 90 && console.log(name +'进入面试');
    //(age >= 24 || bust < 90 )&& console.log(name +'被淘汰');
//}

//const getResume = (name:string,age:number,bust:number)=>{
    //console.log(name)
    //console.log(age)
    //console.log(bust)
//}


//screenResume('dajiao',18,99);
//getResume('dajiao',18,90)
//

interface Girl {
    name:        string;
    age:         number;
    bust:        number;
    waistline ?: number ; // 可有 可没有
    [propname:string] : any;
    // key 是string ,value 是 any
    say():string; //定义了一个方法,必须有
}

class XiaoJiejie implements Girl {
    name:string;
    age:number;
    bust:number = 90;
    say() : string{
        return "helo"
    }
}

interface Teacher extends Girl {
    teach():string;

}

const girl = {
    name:'dajiao',
    age:18,
    bust:95
}

const screenResume = (girl:Girl) => {
    girl.age < 24 && girl.bust >= 90 && console.log(girl.name +'进入面试');
    (girl.age >= 24 || girl.bust < 90 )&& console.log(girl.name +'被淘汰');
}

type Girl1 = string
// interface 和类型别名很像 
// 但 interface 必须 是像 对象这种类型
// type 可以 是单类型


