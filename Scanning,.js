// eslint-disable-next-line max-classes-per-file
export const TIME_TYPE_ENUM = {
  START: 'start',
  END: 'end',
}

class Task {
  constructor() {
    this.list = []
    this.taskLength = 0

    return this
  }

  add(task) {
    this.list.push(task)
    this.updateLength()

    return this.list
  }

  addList(taskList) {
    this.list.push(...taskList)
    this.updateLength()

    return this.list
  }

  deleted(id) {
    const index = this.list.findIndex(i => i.id === id)

    const result = this.list.splice(index, 1)

    this.updateLength()

    return result
  }

  updateLength() {
    this.taskLength = this.list.length

    return this.taskLength
  }

  getTaskNumber() {
    return this.taskLength
  }

  getTaskList() {
    return [...this.list]
  }

  clearTask() {
    this.list = []

    return this.list
  }
}

/**
 * 扫描是否存在时间冲突
 */
export class Scanning {
  /**
   * @param {  StartEndTime [] } list
   *  @param { Object } StartEndTime
   *    @param { String } start required format='YYYY-MM-DD HH:mm:ss'
   *    @param { String } end required format='YYYY-MM-DD HH:mm:ss'
   *    @param { Number || String } id  only required
   *    @param { String } title
   */
  constructor(...arg) {
    this.init(...arg)

    return this
  }

  clearFreePeriodsTime() {
    this.freePeriodsStartTime = null
    this.freePeriodsEndTime = null
  }

  clearConflictPeriodTime() {
    this.conflictPeriodStartTime = null
    this.conflictPeriodEndTime = null
  }

  dealStartTime(item, nowTask) {
    this.task.add(item.dataSource)
    const taskNumber = this.task.getTaskNumber()
    const addEndTask = this.task.getTaskList()

    // 当前只有一个任务
    if (taskNumber === 1) {
      this.freePeriodsStartTime = item.time

      return
    }

    // 冲突开始
    if (taskNumber === 2) {
      this.overlap = true

      console.log('冲突开始', addEndTask)

      // 将目前所有的任务添加进去
      this.conflictPeriodMaxTask.addList(addEndTask)

      this.freePeriodsEndTime = item.time
      this.conflictPeriodStartTime = item.time

      if (this.freePeriodsStartTime === item.time) return

      this.freePeriods.push({
        start: this.freePeriodsStartTime,
        end: this.freePeriodsEndTime,
        task: nowTask,
      })

      this.clearFreePeriodsTime()

      return
    }

    // 冲突中
    if (this.overlap) {
      this.conflictPeriodMaxTask.add(item.dataSource)
    }
  }

  dealEndTime(item, nowTask) {
    // 结束掉一个任务
    this.task.deleted(item.dataSource.id)
    const taskNumber = this.task.getTaskNumber()

    // 所有任务结束
    if (taskNumber === 0) {
      this.overlap = false

      this.freePeriodsEndTime = item.time

      if (this.freePeriodsStartTime === item.time) return

      this.freePeriods.push({
        start: this.freePeriodsStartTime,
        end: this.freePeriodsEndTime,
        task: nowTask,
      })
    }

    // 结束完没有冲突了
    if (taskNumber === 1 && this.overlap) {
      this.overlap = false
      this.conflictPeriodEndTime = item.time
      this.freePeriodsStartTime = item.time

      if (this.conflictPeriodStartTime === item.time) return

      const task = this.conflictPeriodMaxTask.getTaskList()
      console.log('task', task);


      this.conflictPeriods.push({
        start: this.conflictPeriodStartTime,
        end: this.conflictPeriodEndTime,
        task: this.conflictPeriodMaxTask.getTaskList(),
      })

      this.conflictPeriodMaxTask.clearTask()
      this.clearConflictPeriodTime()
    }
  }

  scanningList() {
    const arr = this.createTimeList()
    arr.forEach(item => {
      const nowTask = this.task.getTaskList()

      if (item.type === TIME_TYPE_ENUM.START) {
        this.dealStartTime(item, nowTask)

        return
      }

      if (item.type === TIME_TYPE_ENUM.END) {
        this.dealEndTime(item, nowTask)
      }
    })
  }

  getConflictInterval() {
    const { conflictInterval } = this

    return conflictInterval
  }

  // eslint-disable-next-line class-methods-use-this
  createMomentArray(array) {
    return array.map(i => ({
      ...i,
      momentStart: new Date(i.start).getTime(),
      momentEnd: new Date(i.end).getTime(),
    }))
  }

  createTimeList() {
    const arr = this.createMomentArray(this.list)

    const allTimeArray = []
    arr.forEach(i => {
      const id = i.id

      allTimeArray.push({
        type: TIME_TYPE_ENUM.START,
        time: i.start,
        dataSource: i,
        sortTime: i.momentStart,
        id,
      })

      allTimeArray.push({
        type: TIME_TYPE_ENUM.END,
        time: i.end,
        dataSource: i,
        sortTime: i.momentEnd,
        id,
      })
    })

    // 对数据排序，结束时间和开始时间相同的，结束时间排在前面
    allTimeArray.sort((a, b) => {
      if (a.sortTime === b.sortTime) {
        return a.type === TIME_TYPE_ENUM.END ? -1 : 1
      }

      return a.sortTime - b.sortTime
    })

    return allTimeArray
  }

  checkData() {
    const arr = this.createMomentArray(this.list)

    arr.forEach(i => {
      const { momentStart, momentEnd } = i

      if (momentEnd - momentStart > 0) return

      this.abnormal.push(i)
    })
  }

  init(list) {
    this.list = list

    // 冲突
    this.conflictPeriodStartTime = null
    this.conflictPeriodEndTime = null

    // 非冲突
    this.freePeriodsStartTime = null
    this.freePeriodsEndTime = null

    this.conflictPeriods = []
    this.freePeriods = [] //

    this.abnormal = [] // 异常数据
    // 是否有冲突
    this.overlap = false

    /**
     * 任务数组，扫描到开始时间就往里加一个，扫描到结束就删除一个
     */
    this.task = new Task()

    /**
     * 冲突区间开始到冲突结束区间内的所有任务，只会往里加，直到冲突结束清空任务数组
     */
    this.conflictPeriodMaxTask = new Task()

    this.checkData()

    if (this.abnormal.length !== 0) {
      throw new Error('存在不对的数据')
    }

    this.scanningList()
  }
}
