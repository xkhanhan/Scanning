import Scanning from "./Scanning";

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

try {
  const { conflictPeriods, freePeriods } = new Scanning(schedules);
  console.log("冲突时间段", conflictPeriods);
  console.log("不冲突时间段", freePeriods);
} catch (err) {
  console.log("err", err);
}
