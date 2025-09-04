abstract class Girl{
    abstract skill() //抽象方法
    notskill(){ // 非抽象

    }
}



class waiter extends Girl{
    skill(){
        console.log("daoshui")
    }
}

class senior extends Girl{
    skill(){
        console.log("gaoji daoshui") // 实现
    }
}
