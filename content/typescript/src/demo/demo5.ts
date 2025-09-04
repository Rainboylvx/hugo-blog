
function getTotal(one:number,two:number) : number {
    //return one + two + '';
    return one + two ;
}

//let total  = getTotal(1, '2');
let total  = getTotal(1, 2);

// nerver 永远执行不完
function error_function () : never{
    //return 1;
    throw new Error();
    console.log("Hello world! nerver run")
}

function forNever(): never{
    while(true){}
    console.log("function never end!")
}

// 解析赋值型参数 设置类型
function add({one ,two} : { one:number,two:number}){
    return one +two;
}
const total1 = add({one:1,two:1});
