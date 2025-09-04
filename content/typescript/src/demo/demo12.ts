class Person {
    public name :string;
    constructor(name:string){
        this.name = name;
    }
}

const person = new Person("Tom");

console.log(person.name)

class Person2 {
    constructor(public name:string){ //同样的功能
    }
}

const person2 = new Person2("TOm")
console.log(person2.name)

class Teacher extends Person{
    constructor(public age:number){
        super('Tom'); //必须调用父类的constructor
        //父类只要有constructor,就必须调用super()
    }
}

console.log("===")
const teach = new Teacher(19)
console.log(teach.age)
console.log(teach.name)
