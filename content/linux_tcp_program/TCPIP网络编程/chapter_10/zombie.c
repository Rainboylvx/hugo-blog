#include <stdio.h>
#include <unistd.h>

int main(int argc, char *argv[])
{
    pid_t pid = fork();

    if (pid == 0)
    {
        puts("Hi, I am a child Process");
    }
    else
    {
        printf("Child Process ID: %d \n", pid);
        sleep(30);
        // 因为暂停了 30 秒，所以在这个时间内可以验证一下子进程是否为僵尸进程。
    }

    if (pid == 0)
        puts("End child proess");
    else
        puts("End parent process");
    return 0;
}