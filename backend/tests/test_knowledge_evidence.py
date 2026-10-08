import unittest
from app.agents.knowledge_retrieval_agent import retrieve_chinese_knowledge


class KnowledgeEvidenceTests(unittest.TestCase):
    def test_empty_topic_never_matches_the_first_curated_text(self):
        for topic in ('', ' ', '\n\t'):
            for online in (False, True):
                result = retrieve_chinese_knowledge(topic=topic, allow_internet=online)
                self.assertEqual(result['chunks'], [])
                self.assertFalse(result['verification']['verified'])

    def test_unknown_topic_is_not_verified(self):
        for online in (False, True):
            result = retrieve_chinese_knowledge(topic='不在语料中的课程', allow_internet=online)
            self.assertFalse(result['verification']['verified'])

    def test_known_text_has_source_identifiers(self):
        result = retrieve_chinese_knowledge(topic='高中语文《师说》')
        self.assertTrue(result['verification']['verified'])
        self.assertTrue(all(c['id'] and c['source'] == 'curated' for c in result['original_text']))


if __name__ == '__main__':
    unittest.main()
