const numberArr : number[]  = [1,2,3];

const arr : (string | number)[]  = [1,'str',2];

const xiaojiejies : {
    name:string,
    age:number
} []  = [
    {name:'liuying',age:18}
]

//类型别名
type Lady = {    
    name:string,
    age:number
};

const xiaojie2:Lady[] = [
    {name:'liuying',age:18}
];

class Madam { 
    name:string;
    age:number;
};

const xiaojie3 : Madam[]  = [
    {name:'liuying',age:18}
]
