// 定义日程数据
const schedules = [
  {
    id: 1,
    title: "日程1",
    start: "2025-01-01 00:00:00",
    end: "2025-01-07 23:00:00",
  },
  {
    id: 2,
    title: "日程2",
    start: "2025-01-02 00:00:00",
    end: "2025-01-12 23:00:00",
  },
  {
    id: 3,
    title: "日程3",
    start: "2025-01-02 00:00:00",
    end: "2025-01-06 23:00:00",
  },
  {
    id: 4,
    title: "日程4",
    start: "2025-01-10 00:00:00",
    end: "2025-01-18 23:00:00",
  },
  {
    id: 5,
    title: "日程5",
    start: "2025-01-08 00:00:00",
    end: "2025-01-11 23:00:00",
  },
];

const TIME_TYPE_ENUM = {
  START: "start",
  END: "end",
};

class Task {
  constructor() {
    this.list = [];
    this.taskLength = 0;

    return this;
  }

  add(task) {
    this.list.push(task);
    this.updateLength();

    return this.list;
  }

  deleted(id) {
    const index = this.list.findIndex((i) => i.id === id);

    const result = this.list.splice(index, 1);

    this.updateLength();

    return result;
  }

  updateLength() {
    this.taskLength = this.list.length;

    return this.taskLength;
  }

  getTaskNumber() {
    return this.taskLength;
  }

  getTaskList() {
    return [...this.list];
  }
}

class Scanning {
  /**
   * @param {  StartEndTime [] } list
   *  @param { Object } StartEndTime
   *    @param { String } start required format='YYYY-MM-DD HH:mm:ss'
   *    @param { String } end required format='YYYY-MM-DD HH:mm:ss'
   *    @param { Number || String } id  only required
   *    @param { String } title
   */
  constructor(...arg) {
    this.init(...arg);
    return this;
  }

  clearFreePeriodsTime() {
    this.freePeriodsStartTime = null;
    this.freePeriodsEndTime = null;
  }

  clearConflictPeriodTime() {
    this.conflictPeriodStartTime = null;
    this.conflictPeriodEndTime = null;
  }

  dealStartTime(item, nowTask) {
    this.task.add(item.dataSource);
    const taskNumber = this.task.getTaskNumber();

    if (this.overlap) return;

    // 当前只有一个任务
    if (taskNumber === 1) {
      this.freePeriodsStartTime = item.time;

      return;
    }

    if (taskNumber > 1) {
      this.overlap = true;
      this.freePeriodsEndTime = item.time;
      this.conflictPeriodStartTime = item.time;

      this.freePeriods.push({
        start: this.freePeriodsStartTime,
        end: this.freePeriodsEndTime,
        task: nowTask,
      });

      this.clearFreePeriodsTime();

      return;
    }
  }

  dealEndTime(item, nowTask) {
    // 结束掉一个任务
    this.task.deleted(item.dataSource.id);
    const taskNumber = this.task.getTaskNumber();

    // 所有任务结束
    if (taskNumber === 0) {
      this.overlap = false;
      if (this.freePeriodsStartTime === item.time) return;

      this.freePeriodsEndTime = item.time;

      this.freePeriods.push({
        start: this.freePeriodsStartTime,
        end: this.freePeriodsEndTime,
        task: nowTask,
      });
    }

    // 结束完没有冲突了
    if (taskNumber === 1) {
      this.overlap = false;
      this.conflictPeriodEndTime = item.time;
      this.freePeriodsStartTime = item.time;

      this.conflictPeriods.push({
        start: this.conflictPeriodStartTime,
        end: this.conflictPeriodEndTime,
        task: nowTask,
      });

      this.clearConflictPeriodTime();
    }
  }

  scanningList() {
    const arr = this.createTimeList();

    arr.forEach((item) => {
      const nowTask = this.task.getTaskList();

      if (item.type === TIME_TYPE_ENUM.START) {
        this.dealStartTime(item, nowTask);
        return;
      }

      if (item.type === TIME_TYPE_ENUM.END) {
        this.dealEndTime(item, nowTask);
      }
    });
  }

  getConflictInterval() {
    const { conflictInterval } = this;
    return conflictInterval;
  }

  createMomentArray(array) {
    return array.map((i) => {
      return {
        ...i,
        momentStart: new Date(i.start).getTime(),
        momentEnd: new Date(i.end).getTime(),
      };
    });
  }

  createTimeList() {
    const arr = this.createMomentArray(this.list);

    const allTimeArray = [];
    arr.forEach((i) => {
      const id = i.id;

      allTimeArray.push({
        type: TIME_TYPE_ENUM.START,
        time: i.start,
        dataSource: i,
        sortTime: i.momentStart,
        id,
      });

      allTimeArray.push({
        type: TIME_TYPE_ENUM.END,
        time: i.end,
        dataSource: i,
        sortTime: i.momentEnd,
        id,
      });
    });
    allTimeArray.sort((a, b) => a.sortTime - b.sortTime);

    return allTimeArray;
  }

  checkData() {
    const arr = this.createMomentArray(this.list);

    arr.forEach((i) => {
      const { momentStart, momentEnd } = i;

      if (momentEnd - momentStart > 0) return;

      this.abnormal.push(i);
    });
  }

  init(list) {
    this.list = list;

    // 冲突
    this.conflictPeriodStartTime = null;
    this.conflictPeriodEndTime = null;

    // 非冲突
    this.freePeriodsStartTime = null;
    this.freePeriodsEndTime = null;

    this.conflictPeriods = [];
    this.freePeriods = []; //

    this.abnormal = []; // 异常数据
    // 是否有冲突
    this.overlap = false;

    this.task = new Task();

    this.checkData();

    if (this.abnormal.length !== 0) {
      throw new Error("存在不对的数据");
    }

    this.scanningList();
  }
}

try {
  const { conflictPeriods, freePeriods } = new Scanning(schedules);
  console.log("冲突时间段", conflictPeriods);
  console.log("不冲突时间段", freePeriods);
} catch (err) {
  console.log("err", err);
}
