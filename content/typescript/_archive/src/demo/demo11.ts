class Person {
    public p_name :string = '1';
    protected name2 :string= '1';
    private name3 :string= '1';
}

let p = new Person()

//p.name2 = "this.name"
//p.name3 = "this.name";
p.p_name = "this.name"

class Teacher extends Person {
    sayHello(){
        console.log(this.p_name,"hello")
        console.log(this.name2,"hello")
    }
}

var teach = new Teacher()
teach.p_name = "Tom"
teach.sayHello()
