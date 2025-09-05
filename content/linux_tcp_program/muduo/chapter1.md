## 线程安全的对象生命周期管理 

在多线种的情况下,编写一个线程安全的类尤为困难.这里想要使用`share_ptr`来完全这些问题.

1.1.2 MutexLock与MutexLockGuard

> 这是一个简单的资源类，用RAII(RAII全称是“Resource Acquisition is Initialization”，直译过来是“资源获取即初始化”,也就是说在构造函数中申请分配资源，在析构函数中释放资源)手法封装互斥器的创建与销毁。在Linux下是pthread_mutex_t，默认是不可重入的（&2.1.1）。MutexLock一般是别的class的数据成员。

> MutexLockGuard封装临界区的进入和退出，即加锁和解锁。MutexLockGuard一般是个栈上的对象，它的作用域刚好等于临界区域。

> 这两个class都不允许拷贝构造和赋值，使用原则见&2.1。


1.1.3 一个线程安全的Counter示例

这里使用了神奇的`mutable`关键字.

下面是相关的内容.

- [关键字mutable](https://blog.csdn.net/aaa123524457/article/details/80967330) 
- [关键字const](https://www.cnblogs.com/kevinWu7/p/10163449.html)

书上的`counter`类,在对象销毁的时候会有`race caondition`

1.2 对象的创建很简单

对象的构造要做到线程安全,唯一的要求就是在构造期间不要泄漏this指针.

1.3 销毁太难

> 成员函数用来保护临界区的互斥器本身必须是有效的。而析构函
数破坏了这一假设，它会把mutex成员变量销毁掉。悲剧啊



1.3.2 作为数据成员的 mutex 不能保护析构


原始指针有各种问题

1.4 线程安全的 Observer 有多难


一个`Observable`类,它持有另一个`Observer`的指针,在使用这个指针`Observer * -> update`时,如何保证`Observer`是存在的呢?

在`Observer`析构时调用`unregister()`,这也不行,两个线程A,B同时在访问.
A在析构,B的update,会产生未知情况.


1.4.1 线程安全的 Observer 有多难




1.4.2 线程安全的 Observer 有多难


1.6 神器shared_ptr/weak_ptr


1.8 应用到 Observer 上


既然通过 weak_ptr 能探查对象的生死，那么 Observer 模式的竞态条件就很容易解决，只要让 Observable 保存 weak_ptr<Observer> 即可

如何改成`shared_ptr`,则对应的对象会一直存在.


1.9 再论 shared_ptr 的线程安全


但是 shared_ptr 本身不是100% 线程安全的。它的引用计数本身是安全且无锁的，但对象的读写则不是