"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import { HistoryListItem } from "@/components/history/history-list-item";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import {
  clearInterviewHistory,
  deleteInterviewHistoryItem,
  readInterviewHistory,
} from "@/lib/storage";
import type { InterviewHistoryItem } from "@/types/interview";

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<InterviewHistoryItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const nextHistoryItems = readInterviewHistory();

    startTransition(() => {
      setHistoryItems(nextHistoryItems);
      setIsHydrated(true);
    });
  }, []);

  function handleDeleteItem(id: string) {
    if (!window.confirm("确认删除这条历史记录吗？")) {
      return;
    }

    deleteInterviewHistoryItem(id);
    setHistoryItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  }

  function handleClearAll() {
    if (!window.confirm("确认清空全部历史记录吗？此操作不可撤销。")) {
      return;
    }

    clearInterviewHistory();
    setHistoryItems([]);
  }

  if (!isHydrated) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="正在读取历史记录"
            description="系统正在从当前浏览器加载本地历史记录，请稍候。"
          />
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            正在读取历史记录...
          </div>
        </section>
      </PageContainer>
    );
  }

  if (historyItems.length === 0) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="还没有历史记录"
            description="当前浏览器里还没有保存过面试复盘记录。完成一次模拟面试后，这里会展示你的本地历史。"
          />
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            历史记录只保存在当前浏览器中，不会同步到云端。
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/resume"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              开始新的模拟
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              回到首页
            </Link>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          title="历史记录"
          description="这里会展示当前浏览器中保存的面试复盘历史，列表按最新记录优先展示。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-800">
                共 {historyItems.length} 条本地历史记录
              </p>
              <p className="text-sm text-zinc-500">
                当前版本只保存在本地浏览器中，不支持云端同步和复杂筛选。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/resume"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                开始新的模拟
              </Link>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                清空全部记录
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {historyItems.map((item) => (
            <HistoryListItem
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
            />
          ))}
        </section>
      </div>
    </PageContainer>
  );
}
