// in 收窄
interface Fish { swim: () => void }
interface Bird { fly: () => void }

function move(animal: Fish | Bird): string {
  if ("swim" in animal) {
    animal.swim();          // 收窄为 Fish
    return "swimming";
  }
  animal.fly();             // 收窄为 Bird
  return "flying";
}

// instanceof 收窄：只能用于 class，因为需要运行时存在的构造函数
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function handle(e: unknown): string {
  if (e instanceof ApiError) {
    return `api ${e.status}: ${e.message}`;   // 收窄为 ApiError
  }
  if (e instanceof Error) {
    return `error: ${e.message}`;             // 收窄为 Error
  }
  return String(e);                           // 仍是 unknown
}

console.log(move({ swim: () => {} }), move({ fly: () => {} }));
console.log(handle(new ApiError(404, "not found")), handle(new Error("boom")), handle("plain"));
