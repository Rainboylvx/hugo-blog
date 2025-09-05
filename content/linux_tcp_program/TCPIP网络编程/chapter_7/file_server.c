#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

#define BUF_SIZE 30
void error_handling(char *message);

int main(int argc, char *argv[])
{
    int serv_sd, clnt_sd;
    char buf[BUF_SIZE];

    struct sockaddr_in serv_adr, clnt_adr;

    //1.创建 server_socket
    serv_sd = socket(PF_INET, SOCK_STREAM, 0);

    //2. 设定地址
    memset(&serv_adr, 0, sizeof(serv_adr));
    serv_adr.sin_family = AF_INET;
    serv_adr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_adr.sin_port = htons(8899);

    //3 进行bind
    bind(serv_sd, (struct sockaddr *)&serv_adr, sizeof(serv_adr));
    //4 监听
    listen(serv_sd, 5);

    socklen_t clnt_adr_sz = sizeof(clnt_adr);
    clnt_sd =  accept(serv_sd, (struct sockaddr *)&clnt_adr, &clnt_adr_sz);

    FILE *fp = fopen("file_server.c", "rb");

    while (1)
    {
        int read_cnt = fread(buf, 1, BUF_SIZE, fp);
        if (read_cnt < BUF_SIZE)
        {
            write(clnt_sd, buf, read_cnt);
            break;
        }
        write(clnt_sd, buf, BUF_SIZE);
    }

    //文件发送完毕
    shutdown(clnt_sd, SHUT_WR); //半关闭,写入
    read(clnt_sd, buf, BUF_SIZE); //等待读取
    printf("Received message from client: %s\n", buf);
    fclose(fp);
    close(clnt_sd);
    close(serv_sd);
    return 0;
    return 0;
}

void error_handling(char *message) {
    fputs(message, stderr);
    fputc('\n', stderr);
    exit(1);
}