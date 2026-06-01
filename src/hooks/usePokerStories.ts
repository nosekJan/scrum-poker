import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Story } from "../types/poker";
import { formatTime } from "../utils/poker";

export const usePokerStories = (roomId: string) => {
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [completedStories, setCompletedStories] = useState<Story[]>([]);
  const [storyStartTime, setStoryStartTime] = useState<number | null>(null);

  useEffect(() => {
    const fetchStoriesFromDB = async () => {
      const { data, error } = await supabase
        .from("poker_stories")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formattedStories: Story[] = data.map((s) => ({
          id: s.id,
          title: s.title,
          estimate: s.estimate,
          time: s.time,
          createdAt: new Date(s.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setCompletedStories(formattedStories);
      }
    };

    fetchStoriesFromDB();
  }, [roomId]);

  const saveStoryToDB = async (estimate: string) => {
    if (!activeStory) return null;

    const finalTime = storyStartTime
      ? formatTime(Date.now() - storyStartTime)
      : "00:00";

    const { data, error } = await supabase
      .from("poker_stories")
      .insert([
        {
          room_id: roomId,
          title: activeStory,
          estimate: estimate,
          time: finalTime,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    const newStory: Story = {
      id: data.id,
      title: data.title,
      estimate: data.estimate,
      time: data.time,
      createdAt: new Date(data.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedCompleted = [newStory, ...completedStories];
    setCompletedStories(updatedCompleted);
    setActiveStory(null);
    setStoryStartTime(null);

    return updatedCompleted;
  };

  const deleteStoryFromDB = async (storyId: string) => {
    const { error } = await supabase
      .from("poker_stories")
      .delete()
      .eq("id", storyId);

    if (error) {
      console.error(error);
      return null;
    }

    const updatedCompleted = completedStories.filter((s) => s.id !== storyId);
    setCompletedStories(updatedCompleted);
    return updatedCompleted;
  };

  return {
    activeStory,
    setActiveStory,
    completedStories,
    setCompletedStories,
    storyStartTime,
    setStoryStartTime,
    saveStoryToDB,
    deleteStoryFromDB
  };
};