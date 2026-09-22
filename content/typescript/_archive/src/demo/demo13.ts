class person{
    private _age:number = 18;
    public readonly _name:string;
    constructor( name:string){
        this._name = name;
    }

    //getter
    get age(){
        return this._age + 20;
    }

    set age(age:number){
        this._age = age+3; //玄妙
    }

    static sayLove(){ //不用实例化
        console.log('I L U')
    }
}


const diaojao = new person("diaojao");
console.log(diaojao.age)

diaojao.age = 28;
console.log(diaojao.age)

person.sayLove()

//diaojao._name = "Tom:" // wrong
