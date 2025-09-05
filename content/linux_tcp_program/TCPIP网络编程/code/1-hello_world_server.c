#include <stdio.h>
#include <stdlib.h>
#include <string.h>


#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>



const int port = 8989; //端口

char message[] ="Hello World!";

void error_handle(char *message) {
    printf("error: %s\n",message);
}

int main(int argc, char *argv[])
{

    //创建一个server 端的socket
    // man 7 socket, man 2 socket
    int serv_sock = socket(AF_INET,SOCK_STREAM,0);
    if(serv_sock == -1) {
        error_handle("socket() failed!");
        return 1;
    }

    struct sockaddr_in serv_addr;
    struct sockaddr_in clnt_addr;

    //清空
    // man 7 ip
    memset(&serv_addr,0,sizeof(serv_addr));
    //赋值
    serv_addr.sin_family = AF_INET;
    //host to network short
    //short 16位 2字节
    serv_addr.sin_port = htons(port);
    //host to network long 4字节
    // INADDR_ANY man 7 ip
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);

    // 第二步: bind 端口与ip
    //通用套接字地址结构体sockaddr
    if( bind(serv_sock,(struct sockaddr *)&serv_addr,sizeof(serv_addr) ) == -1) {
        error_handle("bind() failed!");
        return 1;
    }

    //第三步: 激活监听
    if( listen(serv_sock,5) == -1) {
        error_handle("listen() failed!");
        return 1;
    }

    //第四步: 等待连接
    socklen_t client_addr_size = sizeof(clnt_addr);
    int clnt_sock = accept(serv_sock,(struct sockaddr *) &clnt_addr,&client_addr_size);
    if(clnt_sock == -1)
    {
        error_handle("accept() error!");
        return 1;
    }
    write(clnt_sock,message,sizeof(message));
    close(clnt_sock);
    close(serv_sock);
    return 0;
    return EXIT_SUCCESS;
}
