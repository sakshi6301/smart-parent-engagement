RECOMMENDATIONS = {
    "Mathematics": {
        "exercises": ["Practice algebra daily", "Solve 10 problems per day", "Focus on word problems"],
        "videos": ["Khan Academy - Algebra", "Math Antics - Fractions", "PatrickJMT - Calculus"],
        "topics": ["Number Systems", "Algebra", "Geometry", "Statistics"]
    },
    "Science": {
        "exercises": ["Draw and label diagrams", "Revise formulas daily", "Practice numerical problems"],
        "videos": ["CrashCourse Science", "Kurzgesagt - Physics", "TED-Ed Biology"],
        "topics": ["Newton's Laws", "Chemical Reactions", "Cell Biology", "Electricity"]
    },
    "English": {
        "exercises": ["Read one passage daily", "Write a short paragraph", "Practice grammar exercises"],
        "videos": ["BBC Learning English", "English with Lucy", "TED Talks"],
        "topics": ["Grammar", "Comprehension", "Essay Writing", "Vocabulary"]
    },
    "History": {
        "exercises": ["Create timelines", "Write summaries of events", "Practice map work"],
        "videos": ["CrashCourse History", "Oversimplified", "History Channel"],
        "topics": ["Ancient Civilizations", "World Wars", "Indian Independence", "Modern History"]
    },
    "Geography": {
        "exercises": ["Label blank maps", "Study climate zones", "Practice diagram questions"],
        "videos": ["Geography Now", "CrashCourse Geography"],
        "topics": ["Physical Geography", "Climate", "Resources", "Population"]
    }
}

DEFAULT_RECOMMENDATION = {
    "exercises": ["Review class notes", "Practice past papers", "Form a study group"],
    "videos": ["Khan Academy", "YouTube Educational Channels"],
    "topics": ["Revise all chapters", "Focus on weak areas"]
}

def get_recommendations(weak_subjects):
    result = []
    for item in weak_subjects:
        subject = item.get('subject', '')
        avg = item.get('avg', 0)
        rec = RECOMMENDATIONS.get(subject, DEFAULT_RECOMMENDATION)
        result.append({
            "subject": subject,
            "average_score": round(avg, 1),
            "priority": "high" if avg < 40 else "medium",
            "recommendations": rec
        })
    return result
