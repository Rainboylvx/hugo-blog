
// 函数泛型
function join<T>(first: T , second: T){
    return `${first}${second}`
}

join<string>("baidu",".com")

//泛型 数组的使用
function myFUnc<T>(params : T[]){

}

function myFUnc2<T>(params : Array<T> ){

}

//泛型类型推断，最好不要这么用，不好理解
join(1,2)
