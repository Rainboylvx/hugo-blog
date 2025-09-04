function simpleDecorator(target: any) {
  console.log("hi, this is " + target);
  return target;
}

@simpleDecorator
class A {} // "hi, this is class A {}"
