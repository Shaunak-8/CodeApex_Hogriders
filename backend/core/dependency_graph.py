class DependencyGraph:
    def __init__(self):
        self.nodes = []
        self.edges = []
        self._adjacency = {}

    def build_from_failures(self, failures: list):
        self.nodes = list(set([f['file'] for f in failures]))
        self.edges = []
        
        self._adjacency = {node: [] for node in self.nodes}
        for i in range(len(self.nodes) - 1):
            self.edges.append({"source": self.nodes[i], "target": self.nodes[i+1]})
            self._adjacency[self.nodes[i]].append(self.nodes[i+1])

    def get_root_nodes(self) -> list:
        incoming = {node: 0 for node in self.nodes}
        for edge in self.edges:
            incoming[edge['target']] += 1
        return [node for node in self.nodes if incoming[node] == 0]

    def get_blast_radius(self, node_id: str) -> int:
        visited = set()
        
        def dfs(n):
            if n in visited:
                return 0
            visited.add(n)
            count = 1
            for neighbor in self._adjacency.get(n, []):
                count += dfs(neighbor)
            return count

        return max(0, dfs(node_id) - 1)

    def to_dict(self) -> dict:
        return {
            "nodes": self.nodes,
            "edges": self.edges
        }
