import { action, computed, observable } from "mobx";

export class Graph<ND, NID, ED> {
  constructor(public idFromNode: (node: NID | ND) => string) {}

  @observable
  nodes = observable.map<string, Node<ND, NID, ED>>({});

  @action.bound
  addNode(data: ND) {
    const node = new Node<ND, NID, ED>(data, this);
    this.nodes.set(this.idFromNode(data), node);
    return node;
  }

  @action.bound
  addEdge(data: ED, nodeIn: Node<ND, NID, ED>, nodeOut: Node<ND, NID, ED>) {
    nodeIn.addChild(data, nodeOut);
  }

  @computed
  get isEmpty() {
    return this.nodes.size === 0;
  }

  getNode(idOrItem: string | ND | NID) {
    return typeof idOrItem === "string"
      ? this.nodes.get(idOrItem)
      : this.nodes.get(this.idFromNode(idOrItem));
  }
}

class Node<ND, NID, ED> {
  constructor(data: ND, public graqh: Graph<ND, NID, ED>) {
    this.data = data;
  }
  @observable
  data: ND;
  @observable
  edges = observable.array<Edge<ED, ND, NID>>([]);
  @observable
  parent: Node<ND, NID, ED> | null = null;

  @action.bound
  setParent(node: Node<ND, NID, ED> | null) {
    this.parent = node;
  }

  @action.bound
  addChild(dataEdge: ED, node: Node<ND, NID, ED> | ND) {
    if (!(node instanceof Node)) {
      node = this.graqh.addNode(node);
    }
    const edge = new Edge(dataEdge, this, node);
    this.edges.push(edge);
    node.setParent(this);
  }

  @action.bound
  delete() {
    if (this.parent) {
      for (const e of this.edges) {
        this.parent.addChild(e.data, e.nodeOut);
      }
    } else if (this.edges.length === 0) {
      this.edges[0].nodeOut.setParent(null);
    } else {
      throw new Error("Not Implemented");
    }
  }

  @computed
  get id() {
    return this.graqh.idFromNode(this.data);
  }

  @computed
  get parentEdge() {
    return this.parent
      ? this.parent.edges.find(e => e.nodeOut.id === this.id)
      : undefined;
  }
}

class Edge<ED, ND, NID> {
  constructor(
    public data: ED,
    public nodeIn: Node<ND, NID, ED>,
    public nodeOut: Node<ND, NID, ED>
  ) {}
}
