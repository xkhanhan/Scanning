// 定义日程数据
import { TIME_TYPE_ENUM } from "./typing";

export const TIME_TYPE_ENUM = {
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

export default class Scanning {
  /**
   * @param {  StartEndTime [] } list
   *  @param { Object } StartEndTime
   *    @param { String } start required format='YYYY-MM-DD HH:mm:ss'
   *    @param { String } end required format='YYYY-MM-DD HH:mm:ss'
   *    @param { Number || String } id  only required
   *    @param { String } title
   * @param isSubdividedconflict 是根据任务数量否细分冲突
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

    // 当前只有一个任务
    if (taskNumber === 1) {
      this.freePeriodsStartTime = item.time;

      return;
    }

    if (taskNumber === 2) {
      this.overlap = true;

      this.freePeriodsEndTime = item.time;
      this.conflictPeriodStartTime = item.time;

      if (this.freePeriodsStartTime === item.time) return;

      this.freePeriods.push({
        start: this.freePeriodsStartTime,
        end: this.freePeriodsEndTime,
        task: nowTask,
      });

      this.clearFreePeriodsTime();

      return;
    }

    if (this.overlap && this.isSubdividedconflict) {
      this.conflictPeriodEndTime = item.time;

      if (this.conflictPeriodStartTime === item.time) return;

      this.conflictPeriods.push({
        start: this.conflictPeriodStartTime,
        end: this.conflictPeriodEndTime,
        task: nowTask,
      });

      this.conflictPeriodStartTime = item.time;
    }
  }

  dealEndTime(item, nowTask) {
    // 结束掉一个任务
    this.task.deleted(item.dataSource.id);
    const taskNumber = this.task.getTaskNumber();

    // 所有任务结束
    if (taskNumber === 0) {
      this.overlap = false;

      this.freePeriodsEndTime = item.time;

      if (this.freePeriodsStartTime === item.time) return;

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

      if (this.conflictPeriodStartTime === item.time) return;

      this.conflictPeriods.push({
        start: this.conflictPeriodStartTime,
        end: this.conflictPeriodEndTime,
        task: nowTask,
      });

      this.clearConflictPeriodTime();
    }

    // 区分多个任务不同的冲突
    if (this.overlap && this.isSubdividedconflict) {
      this.conflictPeriodEndTime = item.time;

      if (this.conflictPeriodStartTime === item.time) return;

      this.conflictPeriods.push({
        start: this.conflictPeriodStartTime,
        end: this.conflictPeriodEndTime,
        task: nowTask,
      });

      this.conflictPeriodStartTime = item.time;
    }
  }

  scanningList() {
    const arr = this.createTimeList();
    console.log("arr", arr);

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

    // 对数据排序，结束时间和开始时间相同的，结束时间排在前面
    allTimeArray.sort((a, b) => {
      if (a.sortTime === b.sortTime) {
        return a.type === TIME_TYPE_ENUM.END ? -1 : 1;
      }

      return a.sortTime - b.sortTime;
    });

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

  init(list, isSubdividedconflict = true) {
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

    this.isSubdividedconflict = isSubdividedconflict;

    this.task = new Task();

    this.checkData();

    if (this.abnormal.length !== 0) {
      throw new Error("存在不对的数据");
    }

    this.scanningList();
  }
}
