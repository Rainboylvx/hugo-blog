#include <iostream>
#include <thread>
#include <condition_variable>
#include <mutex>
#include <string>
using namespace std;

std::mutex mtx;
bool ready = false;
std::condition_variable cv;

void work_thread() {

    std::unique_lock<std::mutex> lck(mtx); //上unique 锁
    cout << " before wait" << endl;
    // while (!ready)
    // {
        // std::this_thread::sleep_for(std::chrono::milliseconds(100));
        cout << "fall into wait" << endl;
        cv.wait(lck);
    // }
    cout << "after wait" << endl;
}

int main(int argc, char const *argv[])
{


    // 2. 再执行线程
    std::thread t(work_thread);
    //1. 先执行 notify_one
    // std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    cv.notify_one();
    t.join();

    return 0;
}

// 结论: 一定要先wait 再notify_one,才能保证wait函数被唤醒
