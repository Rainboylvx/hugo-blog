class SelectGirl{
    constructor(private girls:string[]){
    }

    getGirl(index:number):string{
        return this.girls[index];
    }
}

const selectGirl = new SelectGirl(['1','2','dajiao'])

// 使用下标 来得到数据
console.log( selectGirl.getGirl(1) )

//泛型重构
class SelectGirl2<T> {
    constructor (private girls : T[]){}

    getGirl(index:number) : T{
        return this.girls[index];
    }
}

const selectgirl2 = new SelectGirl2<string>(['1','2','dajiao'])

// 使用下标 来得到数据
console.log( selectgirl2.getGirl(1) )

//泛型中的继承
interface Girl{
    name: string;
}

// T是一个泛型，但是它之中必需有一个name属性
class selectGirl3<T extends Girl>{ 
    constructor (private girls : T[]){}

    getGirl(index:number) : string {
        return this.girls[index].name;
    }
}

const selectgirl3 = new selectGirl3([
    {name:'1'},
    {name:'2'},
    {name:'3'}
])
console.log( selectgirl3.getGirl(1) )

const a:string  =1

// 泛型约束
// 只能是 number 或 string
//
class SelectGirl4< T extends number | string > {
    constructor(i){}
}
