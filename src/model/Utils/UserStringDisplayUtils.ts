export default {
  /**
   * 通过一个B的文件大小获取可读的文件大小字符串
   * @param filesize 文件大小 单位B
   */
  getReadableFileSize(filesize: number) : string {
    let sizeStr = "";
    if (filesize >= 1073741824) {
      filesize = Math.round((filesize / 1073741824) * 100) / 100;
      sizeStr = filesize + "GB";
    } else if (filesize >= 1048576) {
      filesize = Math.round((filesize / 1048576) * 100) / 100;
      sizeStr = filesize + "MB";
    } else {
      filesize = Math.round((filesize / 1024) * 100) / 100;
      sizeStr = filesize + "KB";
    }
    return sizeStr;
  },
  /**
   * 获取当前时间对用户友好的字符串
   * @returns 
   */
  getFriendlyTime() : string {
    const now = new Date(), hour = now.getHours();
    if (hour < 9) {
      return "早上";
    } else if (hour < 12) {
      return "上午";
    } else if (hour < 14) {
      return "中午";
    } else if (hour < 17) {
      return "下午";
    } else if (hour < 19) {
      return "傍晚";
    } else return "晚上";
  },
  /**
   * 计算剩余时间为用户可读时间
   * @param limitTime 时间
   */
  calcTimeSurplus(limitTime: Date) : string {
    const date1 = new Date(limitTime); //开始时间
    const date2 = new Date(); //结束时间

    const date3 = date1.getTime() - date2.getTime(); //时间差的毫秒数
    if (date3 <= 0) return "已经超过时间了";

    //计算出相差天数
    const days = Math.floor(date3 / (24 * 3600 * 1000));
    //计算出小时数
    const leave1 = date3 % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    const hours = Math.floor(leave1 / (3600 * 1000));
    //计算相差分钟数
    const leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
    const minutes = Math.floor(leave2 / (60 * 1000));
    //计算相差秒数
    const leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
    const seconds = Math.round(leave3 / 1000);

    if (days > 0) return days + "天";
    else if (hours > 0) return hours + "小时";
    else if (minutes > 0) return minutes + "分钟";
    else if (seconds > 0) return seconds + "秒";

    return "已经超过时间了";
  },
  /**
   * 转换时间为 刚刚、几分钟前、几小时前、几天前...
   * @param dateTimeStamp 时间
   */
  calcTimeAgo(time: Date) : string {
    if (!time) return "神秘时间";

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;
    const now = new Date().getTime();
    const diffValue = now - time.getTime();
    let result;
    if (diffValue < 0) {
      return '';
    }
    const yearC = diffValue / year;
    const monthC = diffValue / month;
    const weekC = diffValue / (7 * day);
    const dayC = diffValue / day;
    const hourC = diffValue / hour;
    const minC = diffValue / minute;
    if (yearC >= 1) {
      result = Math.floor(yearC) + "年前";
    } else if (monthC >= 1) {
      result = Math.floor(monthC) + "月前";
    } else if (weekC >= 1) {
      result = Math.floor(weekC) + "周前";
    } else if (dayC >= 1) {
      result = Math.floor(dayC) + "天前";
    } else if (hourC >= 1) {
      result = Math.floor(hourC) + "小时前";
    } else if (minC >= 1) {
      result = Math.floor(minC) + "分钟前";
    } else result = "刚刚";
    return result;
  },
};
